// src/components/UI/ReviewSnippet.tsx
import React from 'react';
import type { Shop, PlaceReview } from '../../types';

/**
 * Review snippet data for display
 */
export interface ReviewSnippetData {
  text: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
}

interface ReviewSnippetProps {
  shop: Shop;
  /** Maximum characters to show before truncation (default: 80) */
  maxLength?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the best review to feature
 *
 * Selection criteria:
 * 1. Has text content (not just a rating)
 * 2. Text is at least 20 characters (meaningful content)
 * 3. Prefer higher rated reviews
 * 4. Return first match
 */
export function getFeaturedReview(shop: Shop): ReviewSnippetData | null {
  const reviews = shop.placeDetails?.reviews;

  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Find reviews with meaningful text, sorted by rating
  const reviewsWithText = reviews
    .filter((review: PlaceReview) =>
      review.text && review.text.length >= 20
    )
    .sort((a: PlaceReview, b: PlaceReview) => (b.rating || 0) - (a.rating || 0));

  if (reviewsWithText.length === 0) {
    return null;
  }

  const bestReview = reviewsWithText[0];

  return {
    text: bestReview.text || '',
    authorName: bestReview.author_name || 'Anonymous',
    authorPhoto: bestReview.profile_photo_url,
    rating: bestReview.rating || 0,
  };
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Try to break at a word boundary
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Get shortened author name (first name + last initial)
 */
function shortenAuthorName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/**
 * ReviewSnippet Component
 *
 * Shows a featured review with truncated text and author info.
 * Provides social proof for the shop.
 *
 * Features:
 * - Smart review selection (best rated with meaningful text)
 * - Text truncation at word boundaries
 * - Author photo (optional)
 * - Hidden when no suitable reviews
 */
const ReviewSnippet: React.FC<ReviewSnippetProps> = ({
  shop,
  maxLength = 80,
  className = '',
}) => {
  const review = getFeaturedReview(shop);

  // Don't render if no suitable review
  if (!review) {
    return null;
  }

  const truncatedText = truncateText(review.text, maxLength);
  const shortAuthor = shortenAuthorName(review.authorName);

  return (
    <div
      className={`review-snippet text-xs ${className}`}
      role="complementary"
      aria-label="Customer review"
    >
      <div className="flex items-start gap-2">
        {/* Quote icon */}
        <svg
          className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>

        {/* Review content */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 dark:text-gray-400 italic line-clamp-2">
            {truncatedText}
          </p>

          {/* Author info */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-gray-500 dark:text-gray-500">—</span>

            {/* Author photo */}
            {review.authorPhoto && (
              <img
                src={review.authorPhoto}
                alt=""
                className="w-4 h-4 rounded-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}

            {/* Author name */}
            <span className="text-gray-500 dark:text-gray-500 font-medium">
              {shortAuthor}
            </span>

            {/* Rating stars (small) */}
            {review.rating > 0 && (
              <span className="text-yellow-500 flex items-center">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[10px] ml-0.5">{review.rating}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSnippet;
