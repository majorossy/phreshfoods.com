// src/components/Listings/ShopCard.tsx
import React, { useEffect, useRef } from 'react';
import { ShopWithDistance, LocationType } from '../../types';
import { useNavigate } from 'react-router-dom';
import { getShopDetailBasePath, getDisplayName, getEmoji, getBadgeClasses, getGlowColor } from '../../utils/typeUrlMappings';
import StarRating from '../UI/StarRating.tsx';
import OptimizedImage from '../UI/OptimizedImage.tsx';
import { escapeHTMLSafe } from '../../utils';
import { useUI } from '../../contexts/UIContext.tsx'; // For selectedShop styling
import { useFilters } from '../../contexts/FilterContext.tsx';
import { useSearch } from '../../contexts/SearchContext.tsx';
import { useTripPlanner } from '../../contexts/TripPlannerContext.tsx';
import { encodeFiltersToURL } from '../../utils/urlSync';

interface ShopCardProps {
  shop: ShopWithDistance;
}

// Helper function to get location type display info
// All display names, emojis, and colors come from centralized config
const getLocationTypeDisplay = (type: string) => {
  const locationType = type as LocationType;
  return {
    emoji: getEmoji(locationType),
    label: getDisplayName(locationType),
    title: getDisplayName(locationType),
    color: getBadgeClasses(locationType),
  };
};

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const navigate = useNavigate();
  const { selectedShop, hoveredShop, setHoveredShop } = useUI(); // Get selectedShop and hoveredShop from UI context
  const { activeProductFilters, activeLocationTypes } = useFilters();
  const { lastPlaceSelectedByAutocomplete, currentRadius } = useSearch();
  const { addStopToTrip, removeStopFromTrip, isShopInTrip, tripStops } = useTripPlanner();
  const cardRef = useRef<HTMLDivElement>(null);
  const locationDisplay = getLocationTypeDisplay(shop.type);

  // Scroll card into view when hovered from map
  useEffect(() => {
    const isHovered = hoveredShop?.slug === shop.slug || hoveredShop?.GoogleProfileID === shop.GoogleProfileID;
    if (isHovered && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [hoveredShop, shop.slug, shop.GoogleProfileID]);

  const handleCardClick = () => {
    // Use slug if available, otherwise use GoogleProfileID as fallback
    const urlIdentifier = shop.slug || shop.GoogleProfileID || `shop-${shop.Name?.replace(/\W/g, '-').toLowerCase()}`;

    // Get type-specific base path using mapping utility
    const basePath = getShopDetailBasePath(shop.type);

    // Build query params with current filter state for shareable URLs
    const filterState = {
      locationTypes: activeLocationTypes,
      productFilters: activeProductFilters,
      searchLocation: lastPlaceSelectedByAutocomplete,
      searchRadius: currentRadius,
    };
    const queryParams = encodeFiltersToURL(filterState);
    const queryString = queryParams.toString();

    // Navigate with filters preserved in URL
    const url = queryString ? `${basePath}/${urlIdentifier}?${queryString}` : `${basePath}/${urlIdentifier}`;
    navigate(url);
  };

  // Google Place Details data is already safe (comes from Google API), only escape our own data
  const displayName = shop.placeDetails?.name || escapeHTMLSafe(shop.Name) || 'Farm Stand';
  const displayAddress = shop.placeDetails?.formatted_address || escapeHTMLSafe(shop.Address) || 'N/A';
  const displayRating = shop.placeDetails?.rating !== undefined ? shop.placeDetails.rating : shop.Rating;
  const displayReviewCount = shop.placeDetails?.user_ratings_total;

  const fallbackImageUrlCard = '/images/Flag_of_Maine.svg'; // Maine flag placeholder

  const actualImageUrl = (shop.ImageOne && String(shop.ImageOne).trim() !== '')
    ? `/images/${String(shop.ImageOne).trim()}`
    : fallbackImageUrlCard;

  const isSelected = selectedShop?.slug === shop.slug || selectedShop?.GoogleProfileID === shop.GoogleProfileID;
  const isHovered = hoveredShop?.slug === shop.slug || hoveredShop?.GoogleProfileID === shop.GoogleProfileID;

  return (
    <div
      ref={cardRef}
      id={`shop-card-${shop.slug || shop.GoogleProfileID || shop.Name?.replace(/\W/g, '')}`}
      className={`
        bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md
        focus-within:shadow-xl
        cursor-pointer group w-full flex flex-col h-full
      `}
      style={{
        // Smooth cubic-bezier transitions for sexy hover effects
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: isHovered || isSelected ? 'transform, box-shadow' : 'auto',
        ...(isSelected
          ? {
              boxShadow: '0 0 0 3px rgb(59, 130, 246), 0 8px 20px -4px rgba(59, 130, 246, 0.3)',
              transform: 'scale(1.02)',
            }
          : isHovered
            ? {
                boxShadow: `0 0 12px 2px ${getGlowColor(shop.type as LocationType)}, 0 15px 35px -8px rgba(0, 0, 0, 0.25)`,
                transform: 'scale(1.03) translateY(-6px)',
              }
            : {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                transform: 'scale(1) translateY(0)',
              }
        ),
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setHoveredShop(shop)}
      onMouseLeave={() => setHoveredShop(null)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
      aria-label={`View details for ${displayName}`}
      aria-current={isSelected ? "page" : undefined}
    >
      {/* Image Section */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        <OptimizedImage
          className="w-full h-full object-cover transition-transform duration-350 ease-smooth group-hover:scale-110"
          src={actualImageUrl}
          alt={`Image of ${displayName}`}
          fallbackSrc={fallbackImageUrlCard}
          width={400}
          height={250}
          loading="lazy"
        />
      </div>

      {/* Content Section */}
      <div className="p-4 flex-grow flex flex-col space-y-2"> {/* Uniform padding and spacing */}
        <div className="flex items-start justify-between gap-2">
          <h2
            className="text-md lg:text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-1"
            title={displayName}
          >
            {displayName}
          </h2>
          {/* Location Type Badge */}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${locationDisplay.color}`}
            title={locationDisplay.title}
          >
            {locationDisplay.emoji} {locationDisplay.label}
          </span>
        </div>

        {/* Rating moved up for prominence */}
        {(displayRating !== "N/A" || (typeof displayReviewCount === 'number' && displayReviewCount > 0)) && (
             <div className="shop-card-rating">
                <StarRating ratingValue={displayRating} reviewCount={displayReviewCount} starSizeClass="w-3.5 h-3.5" />
             </div>
        )}


        {displayAddress && displayAddress !== 'N/A' && (
          <div className="flex items-start text-xs text-gray-600 dark:text-gray-400" title={displayAddress}>
            <svg className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
            <span className="line-clamp-2">{displayAddress}</span> {/* Allow address to wrap slightly */}
          </div>
        )}

        {/* Placeholder for a key product/tag - to be implemented if you add this data */}
        {/* <div className="pt-1 mt-auto"> 
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium dark:bg-green-700 dark:text-green-100">
            Fresh Produce
          </span>
        </div> */}

        {/* Display Distance - NEW */}
        {shop.distanceText && shop.distanceText !== "N/A" && shop.distanceText !== "Set location" && (
          <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM12.56 8.22a.75.75 0 00-1.061 0L6.22 13.56a.75.75 0 00.02 1.062l5.024 4.466a.75.75 0 001.042-.021l5.25-6.75a.75.75 0 00-.001-1.042L12.56 8.22zM12 10a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /> {/* Example icon, choose one you like */}
               <path fillRule="evenodd" d="M9.694 3.138a.75.75 0 01.04.04l4.5 4.5a.75.75 0 01-1.06 1.06L10 5.561V15a.75.75 0 01-1.5 0V5.56L5.372 8.738a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.062-.04zm0-1.5a2.25 2.25 0 013.182.119l4.5 4.5A2.25 2.25 0 0116.25 9H13V3.75A2.25 2.25 0 0010.75 1.5h-1.5a2.25 2.25 0 00-2.25 2.25V9H3.75a2.25 2.25 0 01-1.122-4.262l4.5-4.5A2.25 2.25 0 019.694 1.638zM4 10.5a.75.75 0 01.75.75v3.045c0 .084.036.162.096.222L8.5 18.179a.75.75 0 001.038.021l5.25-6.75a.75.75 0 10-1.204-.936L10 15.561V11.25a.75.75 0 011.5 0v5.679c0 .084-.036.162-.096.222L4.75 12.48A2.25 2.25 0 014 10.5z" clipRule="evenodd" /> {/* Another direction icon */}
            </svg>
            <span>{shop.distanceText}</span>
          </div>
        )}
         {shop.distanceText === "Set location" && (
            <p className="text-xs text-gray-500 italic mt-1">Set start location for distance</p>
        )}

        <div className="!mt-auto pt-2"> {/* Pushes button to bottom, !mt-auto overrides space-y for this specific div */}
          {/* Add to Trip Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isShopInTrip(shop.slug)) {
                // Find the stop ID and remove it
                const stop = tripStops.find(s => s.shop.slug === shop.slug);
                if (stop) {
                  removeStopFromTrip(stop.id);
                }
              } else {
                addStopToTrip(shop);
              }
            }}
            className={`
              w-full text-xs font-semibold py-1.5 px-2 rounded-md transition-colors
              flex items-center justify-center gap-1.5
              ${isShopInTrip(shop.slug)
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400'
                : 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-800 dark:hover:text-blue-300'
              }
            `}
            title={isShopInTrip(shop.slug) ? 'Remove from trip' : 'Add to trip'}
          >
            {isShopInTrip(shop.slug) ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>In Trip</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add to Trip</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Memoize ShopCard to prevent unnecessary re-renders
// Only re-render if the shop identity or distance changes
export default React.memo(ShopCard, (prevProps, nextProps) => {
  // Return true if props are equal (DON'T re-render)
  // Return false if props changed (DO re-render)
  const prevShop = prevProps.shop;
  const nextShop = nextProps.shop;

  // Compare shop identity
  const sameIdentity =
    prevShop.slug === nextShop.slug &&
    prevShop.GoogleProfileID === nextShop.GoogleProfileID;

  // Compare distance (important for location-based searches)
  const sameDistance = prevShop.distance === nextShop.distance;

  // Only skip re-render if both identity and distance are the same
  return sameIdentity && sameDistance;
});