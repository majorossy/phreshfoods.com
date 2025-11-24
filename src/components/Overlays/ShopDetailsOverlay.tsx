// src/components/Overlays/ShopDetailsOverlay.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Shop } from '../../types';
import { escapeHTMLSafe } from '../../utils';
import { useUI } from '../../contexts/UIContext';
import ProductIconGrid from '../UI/ProductIconGrid';

interface ShopDetailsOverlayProps {
  shop: Shop;
  onClose: () => void;
}

const ShopDetailsOverlay: React.FC<ShopDetailsOverlayProps> = ({ shop, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { setSocialOverlayActiveTab } = useUI();
  const [activeTab, setActiveTab] = useState('info');
  const [isCollapsed, setIsCollapsed] = useState(false); // Default: expanded

  // When the overlay opens for a new shop, reset collapse state
  useEffect(() => {
    setIsCollapsed(false); // Reset to expanded state when shop changes
  }, [shop]);

  // Focus management: focus close button when overlay opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Handler for clicking on rating stars to switch to reviews tab
  const handleRatingClick = () => {
    setSocialOverlayActiveTab('reviews');
  };

  // Tab click handler
  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
  };

  // Helper function to get tab classes (3-state system)
  const getTabClasses = (tabName: string) => {
    const isActive = activeTab === tabName;
    if (isActive) {
      return 'border-b-2 border-current';
    } else {
      return 'border-b-2 border-transparent cursor-pointer hover:opacity-80';
    }
  };

  // Helper function to get SVG icon classes
  const getIconClasses = (tabName: string, brandColor: string) => {
    const isActive = activeTab === tabName;
    if (isActive) {
      return brandColor;
    } else {
      const brandIconClasses: Record<string, string> = {
        info: 'text-blue-600 dark:text-blue-400',
        hours: 'text-green-600 dark:text-green-400',
        products: 'text-purple-600 dark:text-purple-400',
      };
      return brandIconClasses[tabName] || 'text-gray-600 dark:text-gray-400';
    }
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

  return (
    <div
      id="detailsOverlayShop"
      className="detail-pop-overlay custom-scrollbar is-open"
      style={{
        transform: isCollapsed ? 'translateX(100%)' : 'translateX(0)',
        transition: 'transform 0.3s ease-in-out'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-name-heading"
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsCollapsed(!isCollapsed);
        }}
        className={`
          absolute top-1/2 -translate-y-1/2 left-0 -translate-x-full z-[60]
          bg-white dark:bg-gray-800
          hover:bg-gray-50 dark:hover:bg-gray-700
          border border-gray-300 dark:border-gray-600
          rounded-l-lg shadow-md
          flex items-center justify-center
          transition-all duration-200
        `}
        style={{
          width: '32px',
          height: '80px',
        }}
        aria-label={isCollapsed ? 'Expand shop details overlay' : 'Collapse shop details overlay'}
        title={isCollapsed ? 'Expand shop details overlay' : 'Collapse shop details overlay'}
        type="button"
      >
        <svg
          className="w-5 h-5 text-gray-600 transition-transform duration-300"
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="overlay-close-button absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 z-10"
        aria-label="Close shop details"
      >
        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <div className="pt-10 sm:pt-12 shrink-0 px-4 sm:px-6">
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

        {/* Tab Navigation */}
        <div className="mb-2 sm:mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav id="shopDetailsTabs" className="flex flex-wrap -mb-px gap-1" aria-label="Tabs">
            {/* Info Tab */}
            <button
              onClick={() => handleTabClick('info')}
              title="Information"
              aria-label="View information tab"
              className={`group inline-flex items-center justify-center py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm rounded-t-md transition-all ${getTabClasses('info')}`}
            >
              <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconClasses('info', 'text-blue-500 dark:text-blue-400')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>

            {/* Hours Tab */}
            <button
              onClick={() => handleTabClick('hours')}
              title="Hours"
              aria-label="View hours tab"
              className={`group inline-flex items-center justify-center py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm rounded-t-md transition-all ${getTabClasses('hours')}`}
            >
              <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconClasses('hours', 'text-green-500 dark:text-green-400')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>

            {/* Products Tab */}
            <button
              onClick={() => handleTabClick('products')}
              title="Products"
              aria-label="View products tab"
              className={`group inline-flex items-center justify-center py-3 px-2 sm:px-3 font-medium text-xs sm:text-sm rounded-t-md transition-all ${getTabClasses('products')}`}
            >
              <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconClasses('products', 'text-purple-500 dark:text-purple-400')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-4">
        {/* Tab Content - Info Tab */}
        {activeTab === 'info' && (
          <div id="shop-info-panel">
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
        )}

        {/* Tab Content - Hours Tab */}
        {activeTab === 'hours' && (
          <div id="shop-hours-panel">
            {parsedHours.length > 0 ? (
              <>
                {/* Open/Closed Status */}
                {openingHours?.open_now !== undefined && (
                  <div className="mb-4 flex items-center justify-center">
                    <span className={`px-4 py-2 text-sm font-semibold rounded-full ${
                      openingHours.open_now
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {openingHours.open_now ? 'Currently Open' : 'Currently Closed'}
                    </span>
                  </div>
                )}

                {/* Hours List */}
                <div className="space-y-2">
                  {parsedHours.map((dayHours, index) => {
                    const isToday = index === todayIndex;
                    return (
                      <div
                        key={index}
                        className={`flex justify-between items-center py-3 px-4 rounded-md transition-colors ${
                          isToday
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No Hours Available
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hours information not available for this location.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content - Products Tab */}
        {activeTab === 'products' && (
          <div id="shop-products-panel">
            <ProductIconGrid
              shop={shop}
              displayMode="detailed"
              showCategories={true}
              showProductNames={true}
              showSummary={true}
              iconSize="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetailsOverlay;
