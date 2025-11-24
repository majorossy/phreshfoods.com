// src/components/UI/StarRating.tsx
import React from 'react';

interface StarRatingProps {
  ratingValue?: number | string | null; // Can be number, string "N/A", or null
  reviewCount?: number | null;
  starSizeClass?: string; // e.g., "w-4 h-4"
}

const StarRating: React.FC<StarRatingProps> = ({
  ratingValue,
  reviewCount,
  starSizeClass = "w-4 h-4" // Default size
}) => {
  const rating = parseFloat(String(ratingValue)); // Convert to string first to handle "N/A" gracefully

  if (isNaN(rating) || rating < 0 || rating > 5) {
    if (ratingValue === "N/A" || ratingValue === "" || ratingValue === null || ratingValue === undefined) {
      return <div className="flex items-center text-xs text-gray-500">No rating</div>;
    }
    return <div className="flex items-center text-xs text-gray-500">No rating</div>;
  }

  const displayRatingValue = rating.toFixed(1);
  const roundedForStarDisplay = Math.round(rating * 2) / 2; // For half stars visual (though we use full for simplicity here)

  const starSVGPath = "M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z";
  const starsHTML: React.ReactElement[] = [];
  for (let i = 1; i <= 5; i++) {
    let starClass = 'text-gray-300'; // Default empty star
    if (i <= roundedForStarDisplay) { // Full star
        starClass = 'text-yellow-400';
    } else if (i - 0.5 === roundedForStarDisplay) { // Half star logic - treat as full for this simple SVG
        starClass = 'text-yellow-400';
    }
    starsHTML.push(
      <svg key={i} className={`${starSizeClass} fill-current ${starClass}`} viewBox="0 0 20 20">
        <path d={starSVGPath} />
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-x-1 text-xs">
      <span className="font-semibold text-gray-700">{displayRatingValue}</span>
      <span className="inline-flex items-center">{starsHTML}</span>
      {(typeof reviewCount === 'number' && reviewCount >= 0) && (
        <span className="text-gray-500 group-hover:text-gray-700">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  );
};

export default StarRating;