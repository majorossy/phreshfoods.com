// src/components/Map/InfoWindowContent.tsx
import React from 'react';
import { Shop } from '../../types'; // Assuming your Shop type is here
import ProductIconGrid from '../UI/ProductIconGrid';

// A simple star rating component with accessibility
const StarRating: React.FC<{ rating: number; reviewCount?: number }> = ({ rating, reviewCount }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const ariaLabel = reviewCount !== undefined
    ? `Rating: ${rating.toFixed(1)} out of 5 stars from ${reviewCount} reviews`
    : `Rating: ${rating.toFixed(1)} out of 5 stars`;

  return (
    <div id="info-window-rating" className="flex items-center gap-x-0.5 text-xs" role="img" aria-label={ariaLabel}>
      <span id="info-window-rating-value" className="font-semibold text-gray-700 mr-1" aria-hidden="true">{rating.toFixed(1)}</span>
      {Array(fullStars).fill(0).map((_, i) => (
        <svg key={`full-${i}`} className="w-3 h-3 fill-current text-yellow-400" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path></svg>
      ))}
      {halfStar && (
        <svg className="w-3 h-3 fill-current text-yellow-400" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" clipPath="inset(0 50% 0 0)"></path>
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" fill="lightgray" clipPath="inset(0 0 0 50%)"></path>
        </svg>
      )}
      {Array(emptyStars).fill(0).map((_, i) => (
        <svg key={`empty-${i}`} className="w-3 h-3 fill-current text-gray-300" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path></svg>
      ))}
      {reviewCount !== undefined && <span id="info-window-review-count" className="ml-1 text-gray-500" aria-hidden="true">({reviewCount})</span>}
    </div>
  );
};


interface InfoWindowContentProps {
  shop: Shop;
}

const InfoWindowContent: React.FC<InfoWindowContentProps> = ({ shop }) => {
  if (!shop) {
    return null;
  }

  return (
    <div id="info-window-content" className="infowindow-content-wrapper font-sans text-sm" style={{ width: '250px' }}> {/* Fixed width example */}
      {/* Product Icons Grid - Shows ALL products with color/grey icons, grouped by category */}
      <ProductIconGrid
        shop={shop}
        displayMode="compact"
        showCategories={true}
        showProductNames={false}
        iconSize="sm"
      />

      <div id="info-window-details" className="p-2">
        <h3 id="info-window-name" className="text-sm font-semibold mb-0.5 truncate text-gray-800 leading-tight" title={shop.Name}>
          {shop.Name}
        </h3>

        {/* Optional Rating - ensure shop.placeDetails.rating exists */}
        {shop.placeDetails?.rating !== undefined && shop.placeDetails.rating > 0 && (
          <div id="info-window-rating-wrapper" className="mb-1">
            <StarRating rating={shop.placeDetails.rating} reviewCount={shop.placeDetails.user_ratings_total} />
          </div>
        )}

        {shop.Address && (
          <p id="info-window-address" className="text-xs text-gray-600 mb-1.5 leading-snug line-clamp-2" title={shop.Address}>
            {shop.Address}
          </p>
        )}
      </div>
    </div>
  );
};

// Memoize InfoWindowContent to prevent unnecessary re-renders
// Only re-render if the shop data changes
export default React.memo(InfoWindowContent, (prevProps, nextProps) => {
  // Compare shop identity to determine if re-render is needed
  const prevShop = prevProps.shop;
  const nextShop = nextProps.shop;

  if (!prevShop && !nextShop) return true; // Both null, no re-render
  if (!prevShop || !nextShop) return false; // One is null, re-render

  // Check if shop identity is the same
  return (
    prevShop.slug === nextShop.slug &&
    prevShop.GoogleProfileID === nextShop.GoogleProfileID &&
    prevShop.Name === nextShop.Name
  );
});