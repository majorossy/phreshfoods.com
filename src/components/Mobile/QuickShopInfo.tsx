// src/components/Mobile/QuickShopInfo.tsx
import React, { useState } from 'react';
import type { Shop } from '../../types';
import { useUI } from '../../contexts/UIContext';
import StarRating from '../UI/StarRating';
import { getDisplayName, getEmoji } from '../../utils/typeUrlMappings';
import ProductIconGrid from '../UI/ProductIconGrid';
import { getProductConfig } from '../../config/productRegistry';

interface QuickShopInfoProps {
  shop: Shop;
  showFullDetails?: boolean;
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
const QuickShopInfo: React.FC<QuickShopInfoProps> = ({ shop, showFullDetails = false }) => {
  const { setBottomSheetHeight, setIsManuallyCollapsed } = useUI();
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['products'])); // Products open by default

  const handleClose = () => {
    // Set flag to prevent auto-expand
    setIsManuallyCollapsed(true);
    // Collapse bottom sheet back to carousel
    setBottomSheetHeight(0.3);
    // Keep selectedShop - let the card stay centered in carousel
    // Don't navigate - stay on current URL
  };

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
      {/* Close Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close shop details"
        >
          <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

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

      {/* Contact Info */}
      {(shop.Phone || shop.Website) && (
        <div className="mb-4 flex gap-3">
          {shop.Phone && (
            <a
              href={`tel:${shop.Phone}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
          )}
          {shop.Website && (
            <a
              href={shop.Website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Website
            </a>
          )}
        </div>
      )}

      {/* Full Details Section - Only shown when showFullDetails is true */}
      {showFullDetails && (
        <div className="space-y-3 mt-4">
          {/* Products Accordion */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => {
                const newSet = new Set(openAccordions);
                if (newSet.has('products')) {
                  newSet.delete('products');
                } else {
                  newSet.add('products');
                }
                setOpenAccordions(newSet);
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#426976] to-[#5a8694] text-white hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="font-medium">Products</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform ${openAccordions.has('products') ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openAccordions.has('products') && (
              <div className="bg-white dark:bg-gray-900 p-4">
                <ProductIconGrid shop={shop} products={getProductConfig(shop.type)} />
              </div>
            )}
          </div>

          {/* Full Hours Accordion */}
          {shop.placeDetails?.opening_hours?.weekday_text && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  const newSet = new Set(openAccordions);
                  if (newSet.has('hours')) {
                    newSet.delete('hours');
                  } else {
                    newSet.add('hours');
                  }
                  setOpenAccordions(newSet);
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#426976] to-[#5a8694] text-white hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Hours</span>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${openAccordions.has('hours') ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openAccordions.has('hours') && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 p-4">
                  <div className="space-y-2">
                    {shop.placeDetails.opening_hours.weekday_text.map((day, index) => (
                      <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickShopInfo;
