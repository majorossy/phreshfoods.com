// src/components/UI/QuickActionBar.tsx
import React, { useCallback } from 'react';
import type { Shop } from '../../types';
import { gestureHaptics } from '../../utils/haptics';

interface QuickActionBarProps {
  shop: Shop;
  /** Callback when directions button is clicked */
  onDirectionsClick?: () => void;
  /** Callback when call button is clicked */
  onCallClick?: () => void;
  /** Callback when website button is clicked */
  onWebsiteClick?: () => void;
  /** Callback when share button is clicked */
  onShareClick?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Action button configuration
 */
interface ActionButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  available: boolean;
  onClick: () => void;
  color?: string;
}

/**
 * QuickActionBar Component
 *
 * Row of quick action buttons for common shop interactions.
 * Designed for mobile-first with touch-friendly targets.
 *
 * Features:
 * - Directions (opens maps)
 * - Call (if phone available)
 * - Website (if URL available)
 * - Share (native share API)
 *
 * Accessibility:
 * - Minimum 44px touch targets
 * - Clear aria-labels
 * - Disabled state for unavailable actions
 */
const QuickActionBar: React.FC<QuickActionBarProps> = ({
  shop,
  onDirectionsClick,
  onCallClick,
  onWebsiteClick,
  onShareClick,
  size = 'sm',
  className = '',
}) => {
  // Check availability of each action
  const hasPhone = Boolean(shop.Phone && shop.Phone.trim());
  const hasWebsite = Boolean(shop.Website && shop.Website.trim());
  const hasLocation = Boolean(shop.lat && shop.lng);
  const hasShare = typeof navigator.share === 'function';

  // Default handlers
  const handleDirections = useCallback(() => {
    gestureHaptics.buttonPress();
    if (onDirectionsClick) {
      onDirectionsClick();
    } else if (hasLocation) {
      // Default: open in Google Maps
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  }, [onDirectionsClick, hasLocation, shop.lat, shop.lng]);

  const handleCall = useCallback(() => {
    gestureHaptics.buttonPress();
    if (onCallClick) {
      onCallClick();
    } else if (hasPhone) {
      window.location.href = `tel:${shop.Phone}`;
    }
  }, [onCallClick, hasPhone, shop.Phone]);

  const handleWebsite = useCallback(() => {
    gestureHaptics.buttonPress();
    if (onWebsiteClick) {
      onWebsiteClick();
    } else if (hasWebsite) {
      const url = shop.Website!.startsWith('http')
        ? shop.Website
        : `https://${shop.Website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [onWebsiteClick, hasWebsite, shop.Website]);

  const handleShare = useCallback(async () => {
    gestureHaptics.buttonPress();
    if (onShareClick) {
      onShareClick();
    } else if (hasShare) {
      try {
        await navigator.share({
          title: shop.Name,
          text: `Check out ${shop.Name}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error - silently ignore
      }
    }
  }, [onShareClick, hasShare, shop.Name]);

  // Action button configurations
  const actions: ActionButton[] = [
    {
      id: 'directions',
      label: 'Directions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      available: hasLocation,
      onClick: handleDirections,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'call',
      label: 'Call',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      available: hasPhone,
      onClick: handleCall,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'website',
      label: 'Website',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      available: hasWebsite,
      onClick: handleWebsite,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'share',
      label: 'Share',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      available: hasShare,
      onClick: handleShare,
      color: 'text-gray-600 dark:text-gray-400',
    },
  ];

  // Filter to only show available actions plus directions (always show)
  const visibleActions = actions.filter(
    (action) => action.id === 'directions' || action.available
  );

  const sizeClasses = size === 'sm'
    ? 'py-1.5 px-2 text-xs gap-1'
    : 'py-2 px-3 text-sm gap-1.5';

  const iconSizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div
      className={`quick-action-bar flex items-center justify-around gap-1 ${className}`}
      role="toolbar"
      aria-label="Shop actions"
    >
      {visibleActions.map((action) => (
        <button
          key={action.id}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          disabled={!action.available}
          className={`
            quick-action-bar__button
            flex items-center justify-center
            ${sizeClasses}
            rounded-lg
            bg-gray-100 dark:bg-gray-700
            hover:bg-gray-200 dark:hover:bg-gray-600
            active:bg-gray-300 dark:active:bg-gray-500
            active:scale-95
            transition-all duration-150
            min-w-[44px] min-h-[44px]
            ${action.available ? action.color : 'text-gray-400 dark:text-gray-500'}
            ${!action.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label={action.label}
          title={action.available ? action.label : `${action.label} not available`}
        >
          <span className={iconSizeClass} aria-hidden="true">
            {action.icon}
          </span>
          <span className="font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActionBar;
