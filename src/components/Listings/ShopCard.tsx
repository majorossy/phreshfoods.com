// src/components/Listings/ShopCard.tsx
import React, { useContext } from 'react'; // Added useContext
import { Shop } from '../../types';
import { useNavigate } from 'react-router-dom';
import StarRating from '../UI/StarRating.tsx';
import { kmToMiles, escapeHTMLSafe } from '../../utils';
import { AppContext } from '../../contexts/AppContext.tsx'; // For selectedShop styling

interface ShopCardProps {
  shop: Shop;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const { selectedShop } = appContext || {}; // Get selectedShop from context

  const handleCardClick = () => {
    if (shop.slug) {
      navigate(`/farm/${shop.slug}`);
    } else {
      console.warn("ShopCard: Clicked on shop without slug:", shop.Name);
      // Fallback: appContext?.openShopOverlays?.(shop);
    }
  };

  const displayName = escapeHTMLSafe(shop.placeDetails?.name || shop.Name || 'Farm Stand');
  const displayAddress = escapeHTMLSafe(shop.placeDetails?.formatted_address || shop.Address || 'N/A');
  const displayRating = shop.placeDetails?.rating !== undefined ? shop.placeDetails.rating : shop.Rating;
  const displayReviewCount = shop.placeDetails?.user_ratings_total;

  const placeholderText = encodeURIComponent(displayName.split(' ').slice(0, 2).join(' ') || 'Farm');
  const fallbackImageUrlCard = `https://placehold.co/400x250/E8DCC3/4A3B2C?text=${placeholderText}&font=inter`; // Adjusted placeholder text

  const actualImageUrl = (shop.ImageOne && String(shop.ImageOne).trim() !== '')
    ? `/images/${String(shop.ImageOne).trim()}`
    : fallbackImageUrlCard;

  let distanceString = '';
  if (shop.distance != null && shop.distance !== Infinity && typeof kmToMiles === 'function') {
    const distMiles = kmToMiles(shop.distance / 1000);
    distanceString = `~${distMiles.toFixed(1)} mi`; // Removed "away" for brevity
  }

  const isSelected = selectedShop?.slug === shop.slug || selectedShop?.GoogleProfileID === shop.GoogleProfileID;

  return (
    <div
      id={`shop-card-${shop.slug || shop.GoogleProfileID || shop.Name?.replace(/\W/g, '')}`}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden 
        hover:shadow-xl focus-within:shadow-xl transition-all duration-300 ease-in-out 
        cursor-pointer group w-full flex flex-col h-full border
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800' : 'border-gray-200 dark:border-gray-700'}
      `}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
      aria-label={`View details for ${displayName}`}
      aria-current={isSelected ? "page" : undefined}
    >
      {/* Image Section */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 relative">
        <img
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          src={actualImageUrl}
          alt={`Image of ${displayName}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = fallbackImageUrlCard;
          }}
        />
        {distanceString && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
            {distanceString}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-grow flex flex-col space-y-2"> {/* Uniform padding and spacing */}
        <h2
          className="text-md lg:text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400"
          title={displayName}
        >
          {displayName}
        </h2>

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

        <div className="!mt-auto pt-2"> {/* Pushes button to bottom, !mt-auto overrides space-y for this specific div */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleCardClick();}} // Stop propagation to prevent double click event if parent also has one
            className="w-full text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-1.5 px-3 rounded-md bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;