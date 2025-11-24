// src/utils/urlSync.ts
import type { LocationType } from '../types/shop';
import { ALL_LOCATION_TYPES } from '../types/shop';
import type { AutocompletePlace } from '../types';

/**
 * Filter state that can be synced with URL
 */
export interface URLFilterState {
  locationTypes: Set<LocationType>;
  productFilters: Record<string, boolean>;
  searchLocation: AutocompletePlace | null;
  searchRadius: number;
}

/**
 * Default filter state (what homepage shows with no URL params)
 */
export const DEFAULT_FILTER_STATE: URLFilterState = {
  locationTypes: new Set<LocationType>(ALL_LOCATION_TYPES),
  productFilters: {},
  searchLocation: null,
  searchRadius: 25, // Default radius in miles
};

/**
 * Parse location types from URL parameter
 * NOTE: Location types are now in the URL path (e.g., /farms), not query params
 * This function is kept for backward compatibility but always returns all types
 * @param _typesParam - Deprecated parameter (no longer used)
 * @returns Set of all location types
 */
function parseLocationTypes(_typesParam: string | null): Set<LocationType> {
  // Types are now parsed from URL path, not query params
  // Always return all types - actual types are handled by FilterContext from path
  return new Set<LocationType>(ALL_LOCATION_TYPES);
}

/**
 * Parse product filters from URL parameter
 * @param productsParam - Comma-separated product keys (e.g., "beef,eggs,salmon")
 * @returns Record of product filters
 */
function parseProductFilters(productsParam: string | null): Record<string, boolean> {
  if (!productsParam) {
    return {};
  }

  const products = productsParam.split(',').filter(Boolean);
  const filters: Record<string, boolean> = {};

  products.forEach(product => {
    // Product key validation happens in FilterContext against active location types
    // Here we just create the filter object
    filters[product] = true;
  });

  return filters;
}

/**
 * Parse search location from URL parameters
 * @param latParam - Latitude as string
 * @param lngParam - Longitude as string
 * @returns AutocompletePlace or null if invalid
 */
function parseSearchLocation(
  latParam: string | null,
  lngParam: string | null
): AutocompletePlace | null {
  // Both lat and lng required for valid location
  if (!latParam || !lngParam) {
    return null;
  }

  const lat = parseFloat(latParam);
  const lng = parseFloat(lngParam);

  // Validate coordinates
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  // Validate lat/lng ranges
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    name: '',
    formatted_address: '',
    geometry: {
      location: { lat, lng },
      viewport: undefined,
    },
    place_id: undefined,
    address_components: undefined,
    types: undefined,
  };
}

/**
 * Parse search radius from URL parameter
 * @param radiusParam - Radius as string
 * @returns Radius in miles (min: 5, max: 100, default: 50)
 */
function parseSearchRadius(radiusParam: string | null): number {
  if (!radiusParam) {
    return DEFAULT_FILTER_STATE.searchRadius;
  }

  const radius = parseFloat(radiusParam);

  // Validate radius
  if (isNaN(radius) || radius < 5 || radius > 100) {
    return DEFAULT_FILTER_STATE.searchRadius;
  }

  return radius;
}

/**
 * Parse all filter state from URL search params
 * @param searchParams - URLSearchParams from useSearchParams()
 * @returns Parsed filter state
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): URLFilterState {
  return {
    locationTypes: parseLocationTypes(searchParams.get('types')),
    productFilters: parseProductFilters(searchParams.get('products')),
    searchLocation: parseSearchLocation(
      searchParams.get('lat'),
      searchParams.get('lng')
    ),
    searchRadius: parseSearchRadius(searchParams.get('radius')),
  };
}

/**
 * Encode location types to URL parameter
 * NOTE: Location types are now in the URL path (e.g., /farms), not query params
 * This function is kept for backward compatibility but always returns null
 * @param _locationTypes - Deprecated parameter (no longer used)
 * @returns Always null (types are now in path, not query params)
 */
function encodeLocationTypes(_locationTypes: Set<LocationType>): string | null {
  // Types are now encoded in URL path, not query params
  // Always return null - actual encoding is handled by useURLSync hook
  return null;
}

/**
 * Encode product filters to URL parameter
 * @param productFilters - Product filter object
 * @returns Comma-separated string or null if no filters
 */
function encodeProductFilters(productFilters: Record<string, boolean>): string | null {
  const activeProducts = Object.keys(productFilters).filter(key => productFilters[key]);

  if (activeProducts.length === 0) {
    return null;
  }

  return activeProducts.sort().join(',');
}

/**
 * Encode search location to URL parameters
 * @param searchLocation - AutocompletePlace or null
 * @returns Object with lat, lng params (or nulls)
 */
function encodeSearchLocation(searchLocation: AutocompletePlace | null): {
  lat: string | null;
  lng: string | null;
} {
  if (!searchLocation?.geometry?.location) {
    return { lat: null, lng: null };
  }

  const { lat, lng } = searchLocation.geometry.location;

  // Handle both LatLng object (with methods) and LatLngLiteral
  const latValue = typeof lat === 'function' ? lat() : lat;
  const lngValue = typeof lng === 'function' ? lng() : lng;

  return {
    lat: latValue.toFixed(2),
    lng: lngValue.toFixed(2),
  };
}

/**
 * Encode filter state to URL search params
 * NOTE: Location types are NOT included (they're in the URL path now)
 * @param filterState - Current filter state
 * @returns URLSearchParams object (products, lat, lng, radius only)
 */
export function encodeFiltersToURL(filterState: URLFilterState): URLSearchParams {
  const params = new URLSearchParams();

  // Location types - NOT encoded (now in URL path, not query params)
  // Keeping this code for backward compatibility but it always returns null
  const typesParam = encodeLocationTypes(filterState.locationTypes);
  if (typesParam) {
    params.set('types', typesParam);
  }

  // Product filters
  const productsParam = encodeProductFilters(filterState.productFilters);
  if (productsParam) {
    params.set('products', productsParam);
  }

  // Search location (lat/lng only, no location name)
  const locationParams = encodeSearchLocation(filterState.searchLocation);
  if (locationParams.lat && locationParams.lng) {
    params.set('lat', locationParams.lat);
    params.set('lng', locationParams.lng);
  }

  // Search radius (only if not default)
  if (filterState.searchRadius !== DEFAULT_FILTER_STATE.searchRadius) {
    params.set('radius', filterState.searchRadius.toString());
  }

  return params;
}

/**
 * Check if filter state matches defaults (for clean homepage URL)
 * @param filterState - Current filter state
 * @returns True if state matches defaults
 */
export function isDefaultFilterState(filterState: URLFilterState): boolean {
  // Check location types (all types = default)
  const hasAllTypes = filterState.locationTypes.size === ALL_LOCATION_TYPES.length &&
    ALL_LOCATION_TYPES.every(type => filterState.locationTypes.has(type));

  // Check product filters (empty = default)
  const hasNoProducts = Object.keys(filterState.productFilters).filter(
    key => filterState.productFilters[key]
  ).length === 0;

  // Check search location (null = default)
  const hasNoLocation = filterState.searchLocation === null;

  // Check radius (50 = default)
  const hasDefaultRadius = filterState.searchRadius === DEFAULT_FILTER_STATE.searchRadius;

  return hasAllTypes && hasNoProducts && hasNoLocation && hasDefaultRadius;
}

/**
 * Compare two filter states for equality (to avoid unnecessary URL updates)
 * @param state1 - First filter state
 * @param state2 - Second filter state
 * @returns True if states are equal
 */
export function filterStatesEqual(state1: URLFilterState, state2: URLFilterState): boolean {
  // Compare location types
  if (state1.locationTypes.size !== state2.locationTypes.size) {
    return false;
  }
  const typesEqual = ALL_LOCATION_TYPES.every(
    type => state1.locationTypes.has(type) === state2.locationTypes.has(type)
  );
  if (!typesEqual) {
    return false;
  }

  // Compare product filters
  const products1 = Object.keys(state1.productFilters).filter(k => state1.productFilters[k]);
  const products2 = Object.keys(state2.productFilters).filter(k => state2.productFilters[k]);
  if (products1.length !== products2.length) {
    return false;
  }
  const productsEqual = products1.every(p => state2.productFilters[p]);
  if (!productsEqual) {
    return false;
  }

  // Compare search location
  const location1 = state1.searchLocation?.geometry?.location;
  const location2 = state2.searchLocation?.geometry?.location;
  if (!location1 && !location2) {
    // Both null
  } else if (!location1 || !location2) {
    return false;
  } else {
    const lat1 = typeof location1.lat === 'function' ? location1.lat() : location1.lat;
    const lng1 = typeof location1.lng === 'function' ? location1.lng() : location1.lng;
    const lat2 = typeof location2.lat === 'function' ? location2.lat() : location2.lat;
    const lng2 = typeof location2.lng === 'function' ? location2.lng() : location2.lng;
    if (lat1 !== lat2 || lng1 !== lng2) {
      return false;
    }
  }

  // Compare radius
  if (state1.searchRadius !== state2.searchRadius) {
    return false;
  }

  return true;
}
