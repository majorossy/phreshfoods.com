// src/components/Map/InfoWindowContent.tsx
import React from 'react';
import { Shop } from '../../types'; // Assuming your Shop type is here

// A simple star rating component (you might have a more complex one)
const StarRating: React.FC<{ rating: number; reviewCount?: number }> = ({ rating, reviewCount }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-x-0.5 text-xs">
      <span className="font-semibold text-gray-700 mr-1">{rating.toFixed(1)}</span>
      {Array(fullStars).fill(0).map((_, i) => (
        <svg key={`full-${i}`} className="w-3 h-3 fill-current text-yellow-400" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path></svg>
      ))}
      {halfStar && (
        <svg className="w-3 h-3 fill-current text-yellow-400" viewBox="0 0 20 20"> {/* Simplified half-star, consider a proper icon */}
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" clipPath="inset(0 50% 0 0)"></path>
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" fill="lightgray" clipPath="inset(0 0 0 50%)"></path>
        </svg>
      )}
      {Array(emptyStars).fill(0).map((_, i) => (
        <svg key={`empty-${i}`} className="w-3 h-3 fill-current text-gray-300" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path></svg>
      ))}
      {reviewCount !== undefined && <span className="ml-1 text-gray-500">({reviewCount})</span>}
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

  // Get image URL from shop data - prioritize custom images from sheet, then Google Photos
  let imageUrl = '/images/placeholder-sm.png'; // Default fallback

  if (shop.ImageOne) {
    // Add /images/ prefix if not already present
    imageUrl = shop.ImageOne.startsWith('/') ? shop.ImageOne : `/images/${shop.ImageOne}`;
  } else if (shop.placeDetails?.photos && shop.placeDetails.photos.length > 0) {
    const photoRef = shop.placeDetails.photos[0].photo_reference;
    // Use backend proxy to fetch photo (keeps API key secure)
    imageUrl = `/api/photo?photo_reference=${photoRef}&maxwidth=400`;
  }

  return (
    <div className="infowindow-content-wrapper font-sans text-sm" style={{ width: '250px' }}> {/* Fixed width example */}
      {/* Optional Image Section */}
      {imageUrl && !imageUrl.includes('placeholder-sm.png') && ( // Don't show placeholder if that's all we have
        <div className="w-full h-24 bg-gray-200 mb-2 rounded-t-md overflow-hidden">
          <img src={imageUrl} alt={shop.Name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className={imageUrl && !imageUrl.includes('placeholder-sm.png') ? "p-2 pt-1" : "p-2"}> {/* Adjust padding if no image */}
        <h3 className="text-sm font-semibold mb-0.5 truncate text-gray-800 leading-tight" title={shop.Name}>
          {shop.Name}
        </h3>

        {/* Optional Rating - ensure shop.placeDetails.rating exists */}
        {shop.placeDetails?.rating !== undefined && shop.placeDetails.rating > 0 && (
          <div className="mb-1">
            <StarRating rating={shop.placeDetails.rating} reviewCount={shop.placeDetails.user_ratings_total} />
          </div>
        )}

        {shop.Address && (
          <p className="text-xs text-gray-600 mb-1.5 leading-snug line-clamp-2" title={shop.Address}>
            {shop.Address}
          </p>
        )}
      </div>
    </div>
  );
};

export default InfoWindowContent;