// src/utils/typeUrlMappings.ts
import type { LocationType } from '../types/shop';
import { ALL_LOCATION_TYPES } from '../types/shop';

/**
 * Bidirectional mapping between internal location types and URL slugs
 *
 * Internal types use underscores (farm_stand) for consistency with backend/API
 * URL slugs use hyphens and plural forms for prettier, more readable URLs
 */

/**
 * Display configuration for location types
 * This is the single source of truth for all user-facing location type names AND colors
 */
export interface LocationTypeColors {
  /** Tailwind CSS classes for badge styling */
  badge: string;
  /** Hex color for map markers (Tailwind color-500 values) */
  marker: string;
  /** RGBA color for hover glow effects */
  glow: string;
}

export interface LocationTypeDisplay {
  singular: string;
  plural: string;
  emoji: string;
  colors: LocationTypeColors;
}

export const LOCATION_TYPE_DISPLAY: Record<LocationType, LocationTypeDisplay> = {
  farm_stand: {
    singular: 'Farm Stand',
    plural: 'Farm Stands',
    emoji: '🚜',
    colors: {
      badge: 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100',
      marker: '#22c55e', // Green-500
      glow: 'rgba(34, 197, 94, 0.5)',
    },
  },
  cheese_shop: {
    singular: 'Cheesemonger',
    plural: 'Cheesemongers',
    emoji: '🧀',
    colors: {
      badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100',
      marker: '#eab308', // Yellow-500
      glow: 'rgba(234, 179, 8, 0.5)',
    },
  },
  fish_monger: {
    singular: 'Fishmonger',
    plural: 'Fishmongers',
    emoji: '🐟',
    colors: {
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100',
      marker: '#3b82f6', // Blue-500
      glow: 'rgba(59, 130, 246, 0.5)',
    },
  },
  butcher: {
    singular: 'Butcher',
    plural: 'Butchers',
    emoji: '🥩',
    colors: {
      badge: 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100',
      marker: '#ef4444', // Red-500
      glow: 'rgba(239, 68, 68, 0.5)',
    },
  },
  antique_shop: {
    singular: 'Antiques',
    plural: 'Antiques',
    emoji: '🏺',
    colors: {
      badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
      marker: '#6b7280', // Gray-500
      glow: 'rgba(107, 114, 128, 0.5)',
    },
  },
  brewery: {
    singular: 'Brewery',
    plural: 'Breweries',
    emoji: '🍺',
    colors: {
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-700 dark:text-amber-100',
      marker: '#d97706', // Amber-600
      glow: 'rgba(217, 119, 6, 0.5)',
    },
  },
  winery: {
    singular: 'Winery',
    plural: 'Wineries',
    emoji: '🍷',
    colors: {
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100',
      marker: '#a855f7', // Purple-500
      glow: 'rgba(168, 85, 247, 0.5)',
    },
  },
  sugar_shack: {
    singular: 'Sugar Shack',
    plural: 'Sugar Shacks',
    emoji: '🍁',
    colors: {
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100',
      marker: '#92400e', // Amber-800 (brown-orange)
      glow: 'rgba(146, 64, 14, 0.5)',
    },
  },
};

/** Default colors for unknown location types */
const DEFAULT_COLORS: LocationTypeColors = {
  badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
  marker: '#ed411a', // Red fallback
  glow: 'rgba(107, 114, 128, 0.5)',
};

// Internal type → URL slug mapping
// Now using consistent paths for both type filters and detail pages
export const TYPE_TO_URL_SLUG: Record<LocationType, string> = {
  farm_stand: 'farm-stand',
  cheese_shop: 'cheesemonger',
  fish_monger: 'fishmonger',
  butcher: 'butcher',
  antique_shop: 'antique-shop',
  brewery: 'brewery',
  winery: 'winery',
  sugar_shack: 'sugar-shack',
};

// URL slug → Internal type mapping (reverse lookup)
export const URL_SLUG_TO_TYPE: Record<string, LocationType> = {
  'farm-stand': 'farm_stand',
  'cheesemonger': 'cheese_shop',
  'fishmonger': 'fish_monger',
  'butcher': 'butcher',
  'antique-shop': 'antique_shop',
  'brewery': 'brewery',
  'winery': 'winery',
  'sugar-shack': 'sugar_shack',
};

/**
 * Convert internal location type to URL slug
 * @param type - Internal location type (e.g., 'farm_stand')
 * @returns URL slug (e.g., 'farm-stand')
 *
 * @example
 * typeToUrlSlug('farm_stand') // Returns 'farm-stand'
 * typeToUrlSlug('cheese_shop') // Returns 'cheesemonger'
 */
export function typeToUrlSlug(type: LocationType): string {
  return TYPE_TO_URL_SLUG[type];
}

/**
 * Convert URL slug to internal location type
 * @param slug - URL slug (e.g., 'farm-stand')
 * @returns Internal location type or null if invalid
 *
 * @example
 * urlSlugToType('farm-stand') // Returns 'farm_stand'
 * urlSlugToType('cheesemonger') // Returns 'cheese_shop'
 * urlSlugToType('invalid') // Returns null
 */
export function urlSlugToType(slug: string): LocationType | null {
  return URL_SLUG_TO_TYPE[slug] || null;
}

/**
 * Encode a set of location types to a URL path segment
 * @param types - Set of location types
 * @returns URL path segment (e.g., 'farm-stand', 'farm-stand+cheesemonger', 'all')
 *
 * @example
 * encodeTypesToPath(new Set(['farm_stand'])) // Returns 'farm-stand'
 * encodeTypesToPath(new Set(['farm_stand', 'cheese_shop'])) // Returns 'farm-stand+cheesemonger'
 * encodeTypesToPath(new Set(ALL_LOCATION_TYPES)) // Returns 'all'
 */
export function encodeTypesToPath(types: Set<LocationType>): string {
  // If all types selected, use 'all'
  if (types.size === ALL_LOCATION_TYPES.length) {
    const hasAllTypes = ALL_LOCATION_TYPES.every(type => types.has(type));
    if (hasAllTypes) {
      return 'all';
    }
  }

  // Convert types to URL slugs and sort for consistent URLs
  const slugs = Array.from(types)
    .map(type => typeToUrlSlug(type))
    .sort();

  // Join with + delimiter
  return slugs.join('+');
}

/**
 * Parse location types from a URL path segment
 * @param pathSegment - URL path segment (e.g., 'farm-stand', 'farm-stand+cheesemonger', 'all', '/')
 * @returns Set of location types (defaults to all types if invalid)
 *
 * @example
 * parseTypesFromPath('farm-stand') // Returns Set(['farm_stand'])
 * parseTypesFromPath('farm-stand+cheesemonger') // Returns Set(['farm_stand', 'cheese_shop'])
 * parseTypesFromPath('all') // Returns Set(ALL_LOCATION_TYPES)
 * parseTypesFromPath('/') // Returns Set(ALL_LOCATION_TYPES)
 * parseTypesFromPath('invalid') // Returns Set(ALL_LOCATION_TYPES)
 */
export function parseTypesFromPath(pathSegment: string | undefined): Set<LocationType> {
  // Handle undefined, empty string, or root path
  if (!pathSegment || pathSegment === '' || pathSegment === '/') {
    return new Set<LocationType>(ALL_LOCATION_TYPES);
  }

  // Remove leading slash if present
  const cleanPath = pathSegment.startsWith('/') ? pathSegment.slice(1) : pathSegment;

  // Handle 'all' keyword
  if (cleanPath === 'all') {
    return new Set<LocationType>(ALL_LOCATION_TYPES);
  }

  // Split by + delimiter
  const slugs = cleanPath.split('+').filter(Boolean);

  // Convert slugs to types
  const types: LocationType[] = [];
  for (const slug of slugs) {
    const type = urlSlugToType(slug);
    if (type) {
      types.push(type);
    }
  }

  // If no valid types found, return all types as fallback
  if (types.length === 0) {
    return new Set<LocationType>(ALL_LOCATION_TYPES);
  }

  return new Set<LocationType>(types);
}

/**
 * Get the base path for a shop detail page based on its type
 * @param type - Shop's location type
 * @returns Base path for detail page (e.g., '/farm', '/cheese')
 *
 * @example
 * getShopDetailBasePath('farm_stand') // Returns '/farm'
 * getShopDetailBasePath('cheese_shop') // Returns '/cheese'
 *
 * Note: Detail pages use singular form (/farm/:slug, /cheese/:slug)
 * while type filter pages use plural/mapped form (/farms, /cheese)
 */
export function getShopDetailBasePath(type: LocationType): string {
  // Detail page paths (singular/specific forms)
  const detailPaths: Record<LocationType, string> = {
    farm_stand: '/farm-stand',
    cheese_shop: '/cheesemonger',
    fish_monger: '/fishmonger',
    butcher: '/butcher',
    antique_shop: '/antique-shop',
    brewery: '/brewery',
    winery: '/winery',
    sugar_shack: '/sugar-shack',
  };

  return detailPaths[type];
}

/**
 * Check if a path is a type filter page (not a detail page)
 * @param pathname - Current pathname from useLocation()
 * @returns True if this is a type filter page
 *
 * @example
 * isTypeFilterPage('/farm-stand') // Returns true
 * isTypeFilterPage('/farm-stand+cheesemonger') // Returns true
 * isTypeFilterPage('/all') // Returns true
 * isTypeFilterPage('/farm-stand/happy-acres') // Returns false
 * isTypeFilterPage('/cheesemonger/maine-cheese') // Returns false
 */
export function isTypeFilterPage(pathname: string): boolean {
  // Remove leading slash
  const path = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  // Empty path is not a type filter page (root path or empty string)
  if (!path) return false;

  // Check if it matches 'all'
  if (path === 'all') return true;

  // Check if it contains detail page patterns (two segments like 'farm/slug')
  if (path.includes('/')) return false;

  // Check if it's a valid type slug or combination
  const slugs = path.split('+').filter(Boolean);
  return slugs.length > 0 && slugs.every(slug => URL_SLUG_TO_TYPE[slug] !== undefined);
}

/**
 * Get the display name for a location type
 * @param type - Location type
 * @param plural - Return plural form (default: false)
 * @returns Display name (e.g., "Farm Stand" or "Farm Stands")
 *
 * @example
 * getDisplayName('farm_stand') // Returns "Farm Stand"
 * getDisplayName('farm_stand', true) // Returns "Farm Stands"
 * getDisplayName('cheese_shop') // Returns "Cheesemonger"
 * getDisplayName('cheese_shop', true) // Returns "Cheesemongers"
 */
export function getDisplayName(type: LocationType, plural: boolean = false): string {
  const display = LOCATION_TYPE_DISPLAY[type];
  return plural ? display.plural : display.singular;
}

/**
 * Get the emoji for a location type
 * @param type - Location type
 * @returns Emoji character (e.g., "🚜", "🧀")
 *
 * @example
 * getEmoji('farm_stand') // Returns "🚜"
 * getEmoji('cheese_shop') // Returns "🧀"
 */
export function getEmoji(type: LocationType): string {
  return LOCATION_TYPE_DISPLAY[type].emoji;
}

/**
 * Get complete display configuration for a location type
 * @param type - Location type
 * @returns Display configuration object
 *
 * @example
 * getDisplayConfig('cheese_shop')
 * // Returns { singular: "Cheesemonger", plural: "Cheesemongers", emoji: "🧀" }
 */
export function getDisplayConfig(type: LocationType): LocationTypeDisplay {
  return LOCATION_TYPE_DISPLAY[type];
}

/**
 * Get Tailwind badge classes for a location type
 * @param type - Location type
 * @returns Tailwind CSS classes for badge styling
 *
 * @example
 * getBadgeClasses('farm_stand') // Returns "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
 */
export function getBadgeClasses(type: LocationType): string {
  return LOCATION_TYPE_DISPLAY[type]?.colors.badge ?? DEFAULT_COLORS.badge;
}

/**
 * Get marker color (hex) for a location type
 * @param type - Location type
 * @returns Hex color string for map markers
 *
 * @example
 * getMarkerColor('farm_stand') // Returns "#22c55e"
 * getMarkerColor('cheese_shop') // Returns "#eab308"
 */
export function getMarkerColor(type: LocationType): string {
  return LOCATION_TYPE_DISPLAY[type]?.colors.marker ?? DEFAULT_COLORS.marker;
}

/**
 * Get glow color (RGBA) for a location type
 * @param type - Location type
 * @returns RGBA color string for hover glow effects
 *
 * @example
 * getGlowColor('farm_stand') // Returns "rgba(34, 197, 94, 0.5)"
 */
export function getGlowColor(type: LocationType): string {
  return LOCATION_TYPE_DISPLAY[type]?.colors.glow ?? DEFAULT_COLORS.glow;
}

/**
 * Get all colors for a location type
 * @param type - Location type
 * @returns Color configuration object
 */
export function getTypeColors(type: LocationType): LocationTypeColors {
  return LOCATION_TYPE_DISPLAY[type]?.colors ?? DEFAULT_COLORS;
}
