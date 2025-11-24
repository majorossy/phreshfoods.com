// src/components/Overlays/ShopDetailsOverlay.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Shop } from '../../types';
import { escapeHTMLSafe } from '../../utils';
import { useUI } from '../../contexts/UIContext';
import { useTripPlanner } from '../../contexts/TripPlannerContext';
import ProductIconGrid from '../UI/ProductIconGrid';
import { getProductConfig } from '../../config/productRegistry';

interface ShopDetailsOverlayProps {
  shop: Shop;
  onClose: () => void;
}

const ShopDetailsOverlay: React.FC<ShopDetailsOverlayProps> = ({ shop, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { setSocialOverlayActiveTab } = useUI();
  const { addStopToTrip, removeStopFromTrip, isShopInTrip, tripStops } = useTripPlanner();
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['info', 'hours', 'products'])); // All open by default
  const [isCollapsed, setIsCollapsed] = useState(false); // Default: expanded

  // When the overlay opens for a new shop, reset accordion state
  useEffect(() => {
    setIsCollapsed(false); // Reset to expanded state when shop changes
    setOpenAccordions(new Set(['info', 'hours', 'products'])); // Reset to all open by default
  }, [shop]);

  // Focus management: focus close button when overlay opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Handler for clicking on rating stars to switch to reviews tab
  const handleRatingClick = () => {
    setSocialOverlayActiveTab('reviews');
  };

  // Accordion toggle handler
  const toggleAccordion = (accordionName: string) => {
    setOpenAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accordionName)) {
        newSet.delete(accordionName);
      } else {
        newSet.add(accordionName);
      }
      return newSet;
    });
  };

  if (!shop) return null;

  // Google Place Details data is already safe (comes from Google API), only escape our own data
  const displayName = shop.placeDetails?.name || escapeHTMLSafe(shop.Name) || 'Shop';
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

  // Calculate product counts for accordion title
  const { availableCount, totalCount } = useMemo(() => {
    const productConfig = getProductConfig(shop.type);
    let available = 0;
    let total = 0;

    for (const productId in productConfig) {
      total++;
      if (shop.products?.[productId] === true) {
        available++;
      }
    }

    return { availableCount: available, totalCount: total };
  }, [shop]);

  // Calculate distance in miles for display
  const distanceInMiles = useMemo(() => {
    if (shop.distance && shop.distance > 0) {
      const miles = shop.distance * 0.000621371; // Convert meters to miles
      return miles.toFixed(1);
    }
    return null;
  }, [shop]);

  return (
    <div
      id="detailsOverlayShop"
      className="detail-pop-overlay custom-scrollbar is-open"
      style={{
        transform: isCollapsed ? 'translateX(100%)' : 'translateX(0)',
        transition: 'transform 0.15s ease-in-out'
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

      <div className="pt-4 sm:pt-5 shrink-0 px-4 sm:px-6">
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

      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-4">
        {/* Accordion - Information & Hours */}
        <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleAccordion('info')}
            className="w-full flex items-center justify-between px-4 py-3 transition-all duration-200"
            style={{
              background: 'linear-gradient(to right, #426976, #5a8694)'
            }}
            aria-expanded={openAccordions.has('info')}
            aria-controls="shop-info-panel"
            id="info-accordion-button"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg className="h-5 w-5 flex-shrink-0" style={{ color: '#F6EBB4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="font-semibold flex-shrink-0" style={{ color: '#F6EBB4' }}>Information</span>
              {displayAddress && displayAddress !== 'N/A' && (
                <div className="flex items-center gap-2 ml-2 text-xs truncate" style={{ fontSize: '0.667em', color: 'white' }}>
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="truncate">{displayAddress}</span>
                </div>
              )}
            </div>
            {(shop as any).distanceText && (shop as any).distanceText !== "N/A" && (shop as any).distanceText !== "Set location" && (
              <div className="flex items-center gap-1 mr-2 text-xs font-medium whitespace-nowrap text-orange-400" style={{ fontSize: '0.667em' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM12.56 8.22a.75.75 0 00-1.061 0L6.22 13.56a.75.75 0 00.02 1.062l5.024 4.466a.75.75 0 001.042-.021l5.25-6.75a.75.75 0 00-.001-1.042L12.56 8.22zM12 10a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M9.694 3.138a.75.75 0 01.04.04l4.5 4.5a.75.75 0 01-1.06 1.06L10 5.561V15a.75.75 0 01-1.5 0V5.56L5.372 8.738a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.062-.04zm0-1.5a2.25 2.25 0 013.182.119l4.5 4.5A2.25 2.25 0 0116.25 9H13V3.75A2.25 2.25 0 0010.75 1.5h-1.5a2.25 2.25 0 00-2.25 2.25V9H3.75a2.25 2.25 0 01-1.122-4.262l4.5-4.5A2.25 2.25 0 019.694 1.638zM4 10.5a.75.75 0 01.75.75v3.045c0 .084.036.162.096.222L8.5 18.179a.75.75 0 001.038.021l5.25-6.75a.75.75 0 10-1.204-.936L10 15.561V11.25a.75.75 0 011.5 0v5.679c0 .084-.036.162-.096.222L4.75 12.48A2.25 2.25 0 014 10.5z" clipRule="evenodd" />
                </svg>
                <span>{(shop as any).distanceText}</span>
              </div>
            )}
            <svg
              className={`h-5 w-5 transform transition-transform duration-200 flex-shrink-0 ${openAccordions.has('info') ? 'rotate-180' : ''}`}
              style={{ color: '#F6EBB4' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          {openAccordions.has('info') && (
            <div
              id="shop-info-panel"
              role="region"
              aria-labelledby="info-accordion-button"
              className="px-3 py-3 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900"
            >
            {/* Basic Info */}
            <div className="space-y-2 mb-4">
              {/* Phone, Website, and Add to Trip - Side by side */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Phone */}
                {displayPhone && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                    </svg>
                    <a
                      href={`tel:${displayPhone}`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {displayPhone}
                    </a>
                  </div>
                )}

                {/* Website */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"></path>
                  </svg>
                  {displayWebsite ? (
                    <a
                      href={displayWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      {displayWebsite.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Website: N/A</span>
                  )}
                </div>

                {/* Add to Trip Button - Small & Compact */}
                <button
                  onClick={() => {
                    if (isShopInTrip(shop.slug)) {
                      const stop = tripStops.find(s => s.shop.slug === shop.slug);
                      if (stop) {
                        removeStopFromTrip(stop.id);
                      }
                    } else {
                      addStopToTrip(shop);
                    }
                  }}
                  className={`
                    ml-auto flex items-center gap-1 px-2 py-1 rounded text-[0.65rem] font-medium
                    transition-all duration-150 group
                    ${isShopInTrip(shop.slug)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400'
                      : 'bg-blue-600 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400 text-white'
                    }
                  `}
                  aria-label={isShopInTrip(shop.slug) ? `Remove ${displayName} from your trip` : `Add ${displayName} to trip`}
                  title={isShopInTrip(shop.slug) ? 'Remove from trip' : 'Add to trip'}
                >
                  {isShopInTrip(shop.slug) ? (
                    <>
                      {/* Check icon - shown by default */}
                      <svg className="w-3 h-3 group-hover:hidden" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {/* Minus icon - shown on hover */}
                      <svg className="w-3 h-3 hidden group-hover:block" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span>In Trip</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Trip</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Hours Section */}
            {parsedHours.length > 0 ? (
              <>
                {/* Dynamic Status Card - Maine Coastal Sunset */}
                <div className="mb-4 rounded-xl p-4 text-center shadow-lg" style={{
                  background: 'linear-gradient(135deg, #426976, #5a8694)'
                }}>
                  {/* Status Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        openingHours?.open_now ? 'animate-dotPulse' : ''
                      }`}
                      style={{
                        backgroundColor: openingHours?.open_now ? '#F6EBB4' : '#ef4444',
                        boxShadow: openingHours?.open_now ? '0 0 8px rgba(246, 235, 180, 0.6)' : 'none'
                      }}
                    />
                    <span className="text-xs font-medium" style={{
                      color: openingHours?.open_now ? '#F6EBB4' : '#fca5a5'
                    }}>
                      {openingHours?.open_now ? 'Currently Open' : 'Currently Closed'}
                    </span>
                  </div>

                  {/* Today's Hours */}
                  {parsedHours[todayIndex] && (
                    <>
                      <div className="text-2xl font-bold mb-1" style={{ color: 'white' }}>
                        {parsedHours[todayIndex].hours}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {parsedHours[todayIndex].day}
                      </div>
                    </>
                  )}
                </div>

                {/* Weekly Grid - Coastal Theme */}
                <div className="grid grid-cols-7 gap-1.5">
                  {parsedHours.map((dayHours, index) => {
                    const isToday = index === todayIndex;
                    const isClosed = dayHours.hours.toLowerCase().includes('closed');
                    const dayAbbr = dayHours.day.substring(0, 3);

                    // Parse hours to short format (e.g., "9:00 AM – 6:00 PM" -> "9-6")
                    let shortHours = dayHours.hours;
                    if (!isClosed) {
                      const match = dayHours.hours.match(/(\d+):?\d*\s*([AP]M)?\s*[–-]\s*(\d+):?\d*\s*([AP]M)?/i);
                      if (match) {
                        const start = match[1];
                        const end = match[3];
                        shortHours = `${start}-${end}`;
                      }
                    }

                    return (
                      <div
                        key={index}
                        className="rounded-lg p-2 text-center transition-all duration-200"
                        style={{
                          background: isToday
                            ? '#F6EBB4'
                            : isClosed
                              ? '#fef9ec'
                              : 'white',
                          border: isToday ? '2px solid #426976' : `1px solid ${isClosed ? '#e8d89f' : '#5a8694'}`,
                          opacity: isClosed ? 0.5 : 1,
                          transform: isToday ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: isToday ? '0 4px 12px rgba(66, 105, 118, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div className="text-[10px] uppercase tracking-wide mb-1" style={{
                          color: isToday ? '#2f4d57' : '#426976',
                          fontWeight: isToday ? 600 : 400
                        }}>
                          {dayAbbr}
                        </div>
                        <div className="text-[10px] font-mono" style={{
                          color: isToday
                            ? '#2f4d57'
                            : isClosed
                              ? '#ef4444'
                              : '#365560',
                          fontWeight: isToday ? 700 : 400
                        }}>
                          {isClosed ? 'Closed' : shortHours}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
            </div>
          )}
        </div>

        {/* Accordion - Products */}
        <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleAccordion('products')}
            className="w-full flex items-center justify-between px-4 py-3 transition-all duration-200"
            style={{
              background: 'linear-gradient(to right, #426976, #5a8694)'
            }}
            aria-expanded={openAccordions.has('products')}
            aria-controls="shop-products-panel"
            id="products-accordion-button"
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0" style={{ color: '#F6EBB4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              <span className="font-semibold flex-shrink-0" style={{ color: '#F6EBB4' }}>Products</span>
              <span className="text-xs" style={{ fontSize: '0.667em', color: 'white' }}>
                <span className="font-semibold text-orange-400">
                  {availableCount}
                </span>
                {' '}available of{' '}
                <span className="font-semibold">{totalCount}</span>
                {' '}total products
              </span>
            </div>
            <svg
              className={`h-5 w-5 transform transition-transform duration-200 flex-shrink-0 ${openAccordions.has('products') ? 'rotate-180' : ''}`}
              style={{ color: '#F6EBB4' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          {openAccordions.has('products') && (
            <div
              id="shop-products-panel"
              role="region"
              aria-labelledby="products-accordion-button"
              className="px-3 py-3 bg-white dark:bg-gray-900"
            >
              <ProductIconGrid
                shop={shop}
                displayMode="detailed"
                showCategories={true}
                showProductNames={true}
                showSummary={false}
                iconSize="sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDetailsOverlay;
