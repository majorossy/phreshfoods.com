// src/components/UI/StatusBadge.tsx
import React from 'react';
import type { Shop } from '../../types';

/**
 * Status info returned by getStatusInfo
 */
export interface StatusInfo {
  status: 'open' | 'closed' | 'closingSoon' | 'openingSoon' | 'permClosed' | 'tempClosed' | 'unknown';
  text: string;
  color: string;
  bgColor: string;
  pulse?: boolean;
}

interface StatusBadgeProps {
  shop: Shop;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Calculate the status info for a shop based on Google Place Details
 */
export function getStatusInfo(shop: Shop): StatusInfo {
  // Check for business status first
  const businessStatus = shop.placeDetails?.business_status;

  if (businessStatus === 'CLOSED_PERMANENTLY') {
    return {
      status: 'permClosed',
      text: 'PERMANENTLY CLOSED',
      color: 'text-white',
      bgColor: 'bg-red-900',
    };
  }

  if (businessStatus === 'CLOSED_TEMPORARILY') {
    return {
      status: 'tempClosed',
      text: 'TEMPORARILY CLOSED',
      color: 'text-white',
      bgColor: 'bg-orange-700',
    };
  }

  // Check open_now status
  const openNow = shop.placeDetails?.opening_hours?.open_now;

  if (openNow === true) {
    return {
      status: 'open',
      text: 'OPEN',
      color: 'text-white',
      bgColor: 'bg-green-500',
      pulse: true,
    };
  }

  if (openNow === false) {
    return {
      status: 'closed',
      text: 'CLOSED',
      color: 'text-white',
      bgColor: 'bg-red-500',
    };
  }

  // Unknown status - don't show badge
  return {
    status: 'unknown',
    text: '',
    color: '',
    bgColor: '',
  };
}

/**
 * StatusBadge Component
 *
 * Displays open/closed status with visual styling:
 * - OPEN: Green with pulsing dot
 * - CLOSED: Red
 * - PERMANENTLY CLOSED: Dark red
 * - TEMPORARILY CLOSED: Orange
 *
 * Hidden when status is unknown (no opening_hours data)
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  shop,
  size = 'sm',
  className = '',
}) => {
  const statusInfo = getStatusInfo(shop);

  // Don't render if status is unknown
  if (statusInfo.status === 'unknown') {
    return null;
  }

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`
        status-badge
        inline-flex items-center
        rounded
        font-semibold uppercase tracking-wide
        ${statusInfo.bgColor}
        ${statusInfo.color}
        ${sizeClasses}
        ${className}
      `}
      role="status"
      aria-label={`Shop is ${statusInfo.text.toLowerCase()}`}
    >
      {/* Pulsing dot for open status */}
      {statusInfo.pulse && (
        <span
          className="status-badge__dot w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"
          aria-hidden="true"
        />
      )}
      {statusInfo.text}
    </span>
  );
};

export default StatusBadge;
