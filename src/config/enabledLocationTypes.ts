// src/config/enabledLocationTypes.ts
import { LocationType } from '../types/shop';

/**
 * Feature flags for location types
 * Control which location types are enabled via environment variables
 *
 * To disable a type:
 * 1. Set VITE_ENABLE_[TYPE]=false in .env
 * 2. Restart dev server
 * 3. Type will be hidden from UI and skipped in data processing
 *
 * To re-enable:
 * 1. Set VITE_ENABLE_[TYPE]=true in .env
 * 2. Restart dev server
 */

// Read from environment variables (defaults to true for backward compatibility)
const ENABLE_BREWERIES = import.meta.env.VITE_ENABLE_BREWERIES !== 'false';
const ENABLE_WINERIES = import.meta.env.VITE_ENABLE_WINERIES !== 'false';
const ENABLE_SUGAR_SHACKS = import.meta.env.VITE_ENABLE_SUGAR_SHACKS !== 'false';

// Base set of always-enabled types
const ALWAYS_ENABLED: LocationType[] = [
  'farm_stand',
  'fish_monger',
  'cheese_shop',
  'butcher',
  'antique_shop',
];

// Conditionally enabled types based on environment variables
const CONDITIONAL_TYPES: Array<{ type: LocationType; enabled: boolean }> = [
  { type: 'brewery', enabled: ENABLE_BREWERIES },
  { type: 'winery', enabled: ENABLE_WINERIES },
  { type: 'sugar_shack', enabled: ENABLE_SUGAR_SHACKS },
];

/**
 * Enabled location types - filtered based on environment variables
 * Use this instead of ALL_LOCATION_TYPES for UI display and filtering
 */
export const ENABLED_LOCATION_TYPES: readonly LocationType[] = [
  ...ALWAYS_ENABLED,
  ...CONDITIONAL_TYPES.filter((t) => t.enabled).map((t) => t.type),
] as const;

// Debug logging removed - feature flags are stable
// To debug, uncomment the block below:
// if (import.meta.env.DEV) {
//   console.log('[EnabledLocationTypes] Enabled types:', ENABLED_LOCATION_TYPES);
// }

/**
 * Helper to check if a specific location type is enabled
 */
export function isLocationTypeEnabled(type: LocationType): boolean {
  return (ENABLED_LOCATION_TYPES as readonly LocationType[]).includes(type);
}

/**
 * Count of enabled location types
 */
export const ENABLED_LOCATION_TYPE_COUNT = ENABLED_LOCATION_TYPES.length;
