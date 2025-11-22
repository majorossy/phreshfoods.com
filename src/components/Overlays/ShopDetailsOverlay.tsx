// src/components/Overlays/ShopDetailsOverlay.tsx
import React, { useEffect, useRef } from 'react';
import { Shop } from '../../types';
import { escapeHTMLSafe } from '../../utils';
import { PRODUCT_ICONS_CONFIG, CATEGORY_DISPLAY_ORDER } from '../../config/appConfig';
import { useUI } from '../../contexts/UIContext';

interface ShopDetailsOverlayProps {
  shop: Shop;
  onClose: () => void;
}

const ShopDetailsOverlay: React.FC<ShopDetailsOverlayProps> = ({ shop, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { setSocialOverlayActiveTab } = useUI();

  // Focus management: focus close button when overlay opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Handler for clicking on rating stars to switch to reviews tab
  const handleRatingClick = () => {
    setSocialOverlayActiveTab('reviews');
  };

  if (!shop) return null;

  // Google Place Details data is already safe (comes from Google API), only escape our own data
  const displayName = shop.placeDetails?.name || escapeHTMLSafe(shop.Name) || 'Farm Stand';
  const displayAddress = shop.placeDetails?.formatted_address || escapeHTMLSafe(shop.Address) || 'N/A';
  const displayPhone = shop.placeDetails?.formatted_phone_number || shop.Phone;
  const displayWebsite = shop.placeDetails?.website || shop.Website;
  const displayRating = shop.placeDetails?.rating !== undefined ? shop.placeDetails.rating : (shop.Rating !== "N/A" ? parseFloat(shop.Rating) : null);
  const displayReviewCount = shop.placeDetails?.user_ratings_total;
  const businessStatus = shop.placeDetails?.business_status;
  const openingHours = shop.placeDetails?.opening_hours;

  // Parse hours for modern display
  const parsedHours = openingHours?.weekday_text?.map(dayText => {
    // Format: "Monday: 9:00 AM – 6:00 PM" or "Monday: Closed"
    const parts = dayText.split(': ');
    return {
      day: parts[0],
      hours: parts[1] || 'Closed'
    };
  }) || [];

  // Get current day (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  // Google's weekday_text starts with Monday (index 0), so we need to adjust
  const todayIndex = today === 0 ? 6 : today - 1;

  // Group all products by category, showing on/off icons
  const allProducts: Record<string, Array<{ id: string; name: string; icon: string; available: boolean }>> = {};
  for (const productId in PRODUCT_ICONS_CONFIG) {
    const product = PRODUCT_ICONS_CONFIG[productId];
    const category = product.category || 'Other';
    const isAvailable = shop[productId as keyof Shop] === true;

    if (!allProducts[category]) {
      allProducts[category] = [];
    }
    allProducts[category].push({
      id: productId,
      name: product.name,
      icon: isAvailable ? product.icon_available : product.icon_unavailable,
      available: isAvailable
    });
  }

  // Check if there are any products to display (should always be true now)
  const hasProducts = Object.keys(allProducts).length > 0;

  return (
    <div
      id="detailsOverlayShop"
      className="detail-pop-overlay custom-scrollbar is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-name-heading"
    >
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="overlay-close-button"
        aria-label="Close shop details"
      >
        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <div className="p-4 sm:p-6 overflow-y-auto h-full">
        {/* Shop Name */}
        <h2 id="shop-name-heading" className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 pr-8">
          {displayName}
        </h2>

        {/* Rating */}
        {displayRating && (
          <div
            className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleRatingClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRatingClick(); }}}
            aria-label={`View ${displayReviewCount || ''} reviews for ${displayName}. Rating: ${displayRating.toFixed(1)} out of 5 stars`}
          >
            <div className="flex items-center" role="img" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < Math.floor(displayRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path>
                </svg>
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {displayRating.toFixed(1)}
            </span>
            {displayReviewCount && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({displayReviewCount} reviews)
              </span>
            )}
          </div>
        )}

        {/* Address */}
        {displayAddress && displayAddress !== 'N/A' && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Address</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
              </svg>
              {displayAddress}
            </p>
          </div>
        )}

        {/* Phone */}
        {displayPhone && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone</h3>
            <a
              href={`tel:${displayPhone}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
              </svg>
              {displayPhone}
            </a>
          </div>
        )}

        {/* Website */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Website</h3>
          {displayWebsite ? (
            <a
              href={displayWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path>
              </svg>
              Visit Website
            </a>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path>
              </svg>
              N/A
            </p>
          )}
        </div>

        {/* Opening Hours - Modern Collapsible Design - Always Visible */}
        <div className="mb-4">
          <details className={`group ${parsedHours.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Hours</h3>
                  {parsedHours.length > 0 && parsedHours[todayIndex] ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Today: <span className="font-medium text-gray-700 dark:text-gray-300">{parsedHours[todayIndex].hours}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500">No hours available</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {parsedHours.length > 0 && openingHours?.open_now !== undefined && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    openingHours.open_now
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {openingHours.open_now ? 'Open' : 'Closed'}
                  </span>
                )}
                <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            {parsedHours.length > 0 ? (
              <div className="mt-3 space-y-2 px-3 pb-2">
                {parsedHours.map((dayHours, index) => {
                  const isToday = index === todayIndex;
                  return (
                    <div
                      key={index}
                      className={`flex justify-between items-center py-2 px-3 rounded-md transition-colors ${
                        isToday
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        isToday
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {dayHours.day}
                      </span>
                      <span className={`text-sm ${
                        isToday
                          ? 'font-semibold text-blue-900 dark:text-blue-100'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {dayHours.hours}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 px-3 pb-2">
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Hours information not available</p>
              </div>
            )}
          </details>
        </div>

        {/* Products Available - Collapsible Accordion - Always Visible */}
        <div className="mb-4">
          <details className={`group ${!hasProducts ? 'opacity-50 pointer-events-none' : ''}`} open={hasProducts}>
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Products</h3>
                  {hasProducts ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {Object.values(allProducts).flat().filter(p => p.available).length} available of {Object.values(allProducts).flat().length} total
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500">No products listed</p>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            {hasProducts ? (
              <div className="mt-3 space-y-3 px-3 pb-2">
                {[...CATEGORY_DISPLAY_ORDER, ...Object.keys(allProducts).filter(cat => !CATEGORY_DISPLAY_ORDER.includes(cat))]
                  .filter(category => allProducts[category] && allProducts[category].length > 0)
                  .map((category) => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 capitalize">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {allProducts[category].map(product => (
                          <div
                            key={product.id}
                            className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs ${
                              product.available
                                ? 'bg-gray-100 dark:bg-gray-700'
                                : 'bg-gray-50 dark:bg-gray-800 opacity-60'
                            }`}
                          >
                            <img
                              src={`/images/icons/${product.icon}`}
                              alt={`${product.name} - ${product.available ? 'Available' : 'Not available'}`}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span className={product.available ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}>
                              {product.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="mt-3 px-3 pb-2">
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Product information not available</p>
              </div>
            )}
          </details>
        </div>

        {/* Google Maps Link */}
        {shop.placeDetails?.url && (
          <div className="mt-6">
            <a
              href={shop.placeDetails.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
              </svg>
              View on Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetailsOverlay;
