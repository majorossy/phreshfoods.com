// src/components/Mobile/QuickShopInfo.tsx
import React from 'react';
import { Shop } from '../../types';
import { useUI } from '../../contexts/UIContext';
import StarRating from '../UI/StarRating';
import { getDisplayName, getEmoji } from '../../utils/typeUrlMappings';

interface QuickShopInfoProps {
  shop: Shop;
}

/**
 * QuickShopInfo - Condensed shop preview for expanded bottom sheet
 *
 * Shows essential info when sheet is expanded (>30vh):
 * - Name, type badge, rating
 * - Address and distance
 * - Opening hours (today only)
 * - "See Full Details" button → opens full overlay
 */
const QuickShopInfo: React.FC<QuickShopInfoProps> = ({ shop }) => {
  const { openShopOverlays } = useUI();

  // Get today's hours if available
  const getTodayHours = () => {
    if (!shop.placeDetails?.opening_hours?.weekday_text) return 'Hours not available';

    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayIndex = today === 0 ? 6 : today - 1; // Convert to Monday = 0 format
    return shop.placeDetails.opening_hours.weekday_text[todayIndex] || 'Hours not available';
  };

  const locationDisplay = {
    emoji: getEmoji(shop.type as any),
    label: getDisplayName(shop.type as any),
  };

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Shop Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
            {shop.placeDetails?.name || shop.Name}
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 whitespace-nowrap flex-shrink-0">
            {locationDisplay.emoji} {locationDisplay.label}
          </span>
        </div>

        {/* Rating */}
        {shop.placeDetails?.rating && (
          <StarRating
            ratingValue={shop.placeDetails.rating}
            reviewCount={shop.placeDetails.user_ratings_total}
            starSizeClass="w-4 h-4"
          />
        )}
      </div>

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Hours Today */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Hours Today
          </h4>
          <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
            {getTodayHours()}
          </p>
        </div>

        {/* Distance */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Distance
          </h4>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {shop.distanceText && shop.distanceText !== 'N/A' && shop.distanceText !== 'Set location'
              ? shop.distanceText
              : 'Set location'}
          </p>
        </div>
      </div>

      {/* Address */}
      {shop.placeDetails?.formatted_address && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Address
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {shop.placeDetails.formatted_address}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => openShopOverlays(shop, 'directions', 'directions')}
          className="
            flex-1 bg-blue-600 hover:bg-blue-700 text-white
            py-2.5 px-4 rounded-lg font-medium text-sm
            transition-colors duration-200
            flex items-center justify-center gap-2
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Directions
        </button>

        <button
          onClick={() => openShopOverlays(shop, 'shop')}
          className="
            flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800
            dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100
            py-2.5 px-4 rounded-lg font-medium text-sm
            transition-colors duration-200
            flex items-center justify-center gap-2
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Full Details
        </button>
      </div>
    </div>
  );
};

export default QuickShopInfo;
