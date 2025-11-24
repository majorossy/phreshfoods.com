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
 * This is the single source of truth for all user-facing location type names
 */
export interface LocationTypeDisplay {
  singular: string;
  plural: string;
  emoji: string;
}

export const LOCATION_TYPE_DISPLAY: Record<LocationType, LocationTypeDisplay> = {
  farm_stand: {
    singular: 'Farm Stand',
    plural: 'Farm Stands',
    emoji: '🚜',
  },
  cheese_shop: {
    singular: 'Cheesemonger',
    plural: 'Cheesemongers',
    emoji: '🧀',
  },
  fish_monger: {
    singular: 'Fishmonger',
    plural: 'Fishmongers',
    emoji: '🐟',
  },
  butcher: {
    singular: 'Butcher',
    plural: 'Butchers',
    emoji: '🥩',
  },
  antique_shop: {
    singular: 'Antiques',
    plural: 'Antiques',
    emoji: '🏺',
  },
  brewery: {
    singular: 'Brewery',
    plural: 'Breweries',
    emoji: '🍺',
  },
  winery: {
    singular: 'Winery',
    plural: 'Wineries',
    emoji: '🍷',
  },
  sugar_shack: {
    singular: 'Sugar Shack',
    plural: 'Sugar Shacks',
    emoji: '🍁',
  },
};

// Internal type → URL slug mapping
export const TYPE_TO_URL_SLUG: Record<LocationType, string> = {
  farm_stand: 'farms',
  cheese_shop: 'cheese',
  fish_monger: 'fish',
  butcher: 'butchers',
  antique_shop: 'antiques',
  brewery: 'breweries',
  winery: 'wineries',
  sugar_shack: 'sugar-shacks',
};

// URL slug → Internal type mapping (reverse lookup)
export const URL_SLUG_TO_TYPE: Record<string, LocationType> = {
  farms: 'farm_stand',
  cheese: 'cheese_shop',
  fish: 'fish_monger',
  butchers: 'butcher',
  antiques: 'antique_shop',
  breweries: 'brewery',
  wineries: 'winery',
  'sugar-shacks': 'sugar_shack',
};

/**
 * Convert internal location type to URL slug
 * @param type - Internal location type (e.g., 'farm_stand')
 * @returns URL slug (e.g., 'farms')
 *
 * @example
 * typeToUrlSlug('farm_stand') // Returns 'farms'
 * typeToUrlSlug('cheese_shop') // Returns 'cheese'
 */
export function typeToUrlSlug(type: LocationType): string {
  return TYPE_TO_URL_SLUG[type];
}

/**
 * Convert URL slug to internal location type
 * @param slug - URL slug (e.g., 'farms')
 * @returns Internal location type or null if invalid
 *
 * @example
 * urlSlugToType('farms') // Returns 'farm_stand'
 * urlSlugToType('cheese') // Returns 'cheese_shop'
 * urlSlugToType('invalid') // Returns null
 */
export function urlSlugToType(slug: string): LocationType | null {
  return URL_SLUG_TO_TYPE[slug] || null;
}

/**
 * Encode a set of location types to a URL path segment
 * @param types - Set of location types
 * @returns URL path segment (e.g., 'farms', 'farms+cheese', 'all')
 *
 * @example
 * encodeTypesToPath(new Set(['farm_stand'])) // Returns 'farms'
 * encodeTypesToPath(new Set(['farm_stand', 'cheese_shop'])) // Returns 'farms+cheese'
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
 * @param pathSegment - URL path segment (e.g., 'farms', 'farms+cheese', 'all', '/')
 * @returns Set of location types (defaults to all types if invalid)
 *
 * @example
 * parseTypesFromPath('farms') // Returns Set(['farm_stand'])
 * parseTypesFromPath('farms+cheese') // Returns Set(['farm_stand', 'cheese_shop'])
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
 * isTypeFilterPage('/farms') // Returns true
 * isTypeFilterPage('/farms+cheese') // Returns true
 * isTypeFilterPage('/all') // Returns true
 * isTypeFilterPage('/farm/happy-acres') // Returns false
 * isTypeFilterPage('/cheese/maine-cheese') // Returns false
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
