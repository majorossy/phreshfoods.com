// src/components/Overlays/ShopDetailsOverlay.tsx
import React from 'react';
import { Shop } from '../../types';
import { escapeHTMLSafe } from '../../utils';
import { PRODUCT_ICONS_CONFIG, CATEGORY_DISPLAY_ORDER } from '../../config/appConfig';

interface ShopDetailsOverlayProps {
  shop: Shop;
  onClose: () => void;
}

const ShopDetailsOverlay: React.FC<ShopDetailsOverlayProps> = ({ shop, onClose }) => {
  if (!shop) return null;

  const displayName = escapeHTMLSafe(shop.placeDetails?.name || shop.Name || 'Farm Stand');
  const displayAddress = escapeHTMLSafe(shop.placeDetails?.formatted_address || shop.Address || 'N/A');
  const displayPhone = shop.placeDetails?.formatted_phone_number || shop.Phone;
  const displayWebsite = shop.placeDetails?.website || shop.Website;
  const displayRating = shop.placeDetails?.rating !== undefined ? shop.placeDetails.rating : (shop.Rating !== "N/A" ? parseFloat(shop.Rating) : null);
  const displayReviewCount = shop.placeDetails?.user_ratings_total;
  const businessStatus = shop.placeDetails?.business_status;
  const openingHours = shop.placeDetails?.opening_hours;

  // Group available products by category
  const availableProducts: Record<string, Array<{ id: string; name: string; icon: string }>> = {};
  for (const productId in PRODUCT_ICONS_CONFIG) {
    if (shop[productId as keyof Shop] === true) {
      const product = PRODUCT_ICONS_CONFIG[productId];
      const category = product.category || 'Other';
      if (!availableProducts[category]) {
        availableProducts[category] = [];
      }
      availableProducts[category].push({
        id: productId,
        name: product.name,
        icon: product.icon_available
      });
    }
  }

  // Check if there are any products to display
  const hasProducts = Object.keys(availableProducts).length > 0;

  return (
    <div id="detailsOverlayShop" className="detail-pop-overlay custom-scrollbar is-open">
      <button
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
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 pr-8">
          {displayName}
        </h2>

        {/* Rating */}
        {displayRating && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < Math.floor(displayRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
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

        {/* Business Status */}
        {businessStatus && (
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              businessStatus === 'OPERATIONAL'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {businessStatus === 'OPERATIONAL' ? 'Open' : 'Closed'}
            </span>
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
        {displayWebsite && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Website</h3>
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
          </div>
        )}

        {/* Opening Hours */}
        {openingHours?.weekday_text && openingHours.weekday_text.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Hours</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {openingHours.weekday_text.map((hours, index) => (
                <li key={index} className="flex justify-between">
                  <span>{hours}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Products Available */}
        {hasProducts && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Products Available</h3>
            <div className="space-y-3">
              {[...CATEGORY_DISPLAY_ORDER, ...Object.keys(availableProducts).filter(cat => !CATEGORY_DISPLAY_ORDER.includes(cat))]
                .filter(category => availableProducts[category] && availableProducts[category].length > 0)
                .map((category) => (
                  <div key={category}>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 capitalize">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableProducts[category].map(product => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-xs"
                        >
                          <img
                            src={`/images/icons/${product.icon}`}
                            alt={product.name}
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

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
