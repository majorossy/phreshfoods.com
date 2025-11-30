// src/components/UI/EmptyState.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationType } from '../../types';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  const defaultIcon = (
    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  return (
    <div id="empty-state" className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      <h3 id="empty-state-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p id="empty-state-description" className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <button
          id="empty-state-action-button"
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

// Preset empty states for common scenarios
export const NoResultsState: React.FC<{
  onClearFilters?: () => void;
  activeLocationTypes?: Set<LocationType>;
}> = ({ onClearFilters, activeLocationTypes }) => {
  const navigate = useNavigate();

  // Generate context-aware message based on selected location types
  const getEmptyMessage = () => {
    const typesArray = Array.from(activeLocationTypes || []);
    const hasOnlyFarms = typesArray.length === 1 && typesArray[0] === 'farm_stand';
    const hasOnlyCheese = typesArray.length === 1 && typesArray[0] === 'cheese_shop';
    const hasBoth = typesArray.length === 2;

    if (hasOnlyFarms) {
      return {
        title: "No farm stands found",
        description: "We couldn't find any farm stands matching your filters. Try expanding your search radius or selecting cheesemongers."
      };
    } else if (hasOnlyCheese) {
      return {
        title: "No cheesemongers found",
        description: "We couldn't find any cheesemongers matching your filters. Try expanding your search radius or selecting farm stands."
      };
    } else if (hasBoth || typesArray.length === 0) {
      return {
        title: "No locations found",
        description: "We couldn't find any locations matching your filters. Try adjusting your product filters or expanding your search radius."
      };
    }

    // Fallback
    return {
      title: "No locations found",
      description: "We couldn't find any locations in this area. Try expanding your search radius."
    };
  };

  const { title, description } = getEmptyMessage();

  return (
    <div id="no-results-state" className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">
        <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 id="no-results-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p id="no-results-description" className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {onClearFilters && (
          <button
            id="clear-filters-button"
            onClick={onClearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Clear All Filters
          </button>
        )}
        <button
          id="browse-categories-button"
          onClick={() => navigate('/not-sure')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Browse Categories
        </button>
      </div>
    </div>
  );
};

export const NoLocationState: React.FC<{ onSetLocation?: () => void }> = ({ onSetLocation }) => (
  <EmptyState
    icon={
      <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    }
    title="Set your location"
    description="Enter your location in the search box above to find farm stands near you."
    action={onSetLocation ? {
      label: "Set Location",
      onClick: onSetLocation
    } : undefined}
  />
);

export const LoadingErrorState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon={
      <svg className="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    }
    title="Something went wrong"
    description="We encountered an error loading farm stands. Please try again."
    action={onRetry ? {
      label: "Try Again",
      onClick: onRetry
    } : undefined}
  />
);
