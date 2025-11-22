// src/components/UI/ShopCardSkeleton.tsx
import React from 'react';

const ShopCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 w-full flex flex-col h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-300 dark:bg-gray-700 relative h-48"></div>

      {/* Content Skeleton */}
      <div className="p-4 flex-grow flex flex-col space-y-3">
        {/* Title Skeleton */}
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>

        {/* Rating Skeleton */}
        <div className="flex items-center space-x-1">
          <div className="h-3.5 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Address Skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div>
        </div>

        {/* Distance Skeleton */}
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24 mt-2"></div>

        {/* Button Skeleton */}
        <div className="!mt-auto pt-2">
          <div className="h-9 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ShopCardSkeleton;
