// src/utils/shopFilters.ts
import { Shop, ShopWithDistance, AutocompletePlace } from '../types';
import { METERS_PER_MILE, MILES_PER_METER } from '../config/appConfig';

export interface FilterOptions {
  productFilters: Record<string, boolean>;
  location: AutocompletePlace | null;
  radius: number; // in miles
  mapsApiReady: boolean;
}

/**
 * Helper function to extract lat/lng from AutocompletePlace location
 * Handles both function-based and literal-based LatLng objects
 */
function extractLatLng(placeLocation: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined): { lat: number; lng: number } | null {
  if (!placeLocation) return null;

  // Type guard for LatLng (has methods)
  if ('lat' in placeLocation && typeof placeLocation.lat === 'function') {
    return {
      lat: placeLocation.lat(),
      lng: (placeLocation as google.maps.LatLng).lng()
    };
  }

  // Type guard for LatLngLiteral (has properties)
  if ('lat' in placeLocation && typeof placeLocation.lat === 'number') {
    return {
      lat: placeLocation.lat,
      lng: (placeLocation as google.maps.LatLngLiteral).lng
    };
  }

  return null;
}

/**
 * Filters and sorts shops based on product availability, location, and radius
 *
 * @param shops - All available shops to filter
 * @param options - Filter options including products, location, radius
 * @returns Filtered and sorted shops with distance information
 */
export function filterAndSortShops(
  shops: Shop[],
  options: FilterOptions
): ShopWithDistance[] {
  if (!shops || shops.length === 0) {
    return [];
  }

  let filteredShops: Shop[] = [...shops];

  // 1. Apply Product Filters
  const activeFilterKeys = Object.keys(options.productFilters).filter(
    key => options.productFilters[key]
  );

  if (activeFilterKeys.length > 0) {
    filteredShops = filteredShops.filter((shop: Shop) => {
      return activeFilterKeys.every(filterKey => {
        const productIsAvailable = !!(shop[filterKey as keyof Shop] as boolean | undefined);
        return productIsAvailable;
      });
    });
  }

  // 2. Extract search center coordinates once (reuse for both filtering and distance calculation)
  let searchCenterLatLng: google.maps.LatLng | null = null;

  if (
    options.mapsApiReady &&
    window.google?.maps?.geometry?.spherical &&
    options.location?.geometry?.location
  ) {
    const coords = extractLatLng(options.location.geometry.location);
    if (coords) {
      searchCenterLatLng = new window.google.maps.LatLng(coords.lat, coords.lng);
    }
  }

  // 3. Apply Location/Radius Filter (if we have a search center)
  if (searchCenterLatLng && options.radius > 0) {
    const radiusInMeters = options.radius * METERS_PER_MILE;

    filteredShops = filteredShops.filter(shop => {
      if (
        shop.lat == null ||
        shop.lng == null ||
        isNaN(shop.lat) ||
        isNaN(shop.lng)
      )
        return false;

      const shopLatLng = new window.google.maps.LatLng(shop.lat, shop.lng);
      try {
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          searchCenterLatLng,
          shopLatLng
        );
        return distance <= radiusInMeters;
      } catch (e) {
        return false;
      }
    });
  }

  // 4. Calculate Distances and Format for Display (reuse searchCenterLatLng)
  let shopsWithDistance: ShopWithDistance[] = [];

  if (searchCenterLatLng) {
    shopsWithDistance = filteredShops.map(shop => {
      if (
        shop.lat != null &&
        shop.lng != null &&
        !isNaN(shop.lat) &&
        !isNaN(shop.lng)
      ) {
        const shopLatLng = new window.google.maps.LatLng(shop.lat, shop.lng);
        try {
          const distanceInMeters = window.google.maps.geometry.spherical.computeDistanceBetween(
            searchCenterLatLng,
            shopLatLng
          );
          const distanceInMiles = distanceInMeters * MILES_PER_METER;
          return {
            ...shop,
            distance: distanceInMeters,
            distanceText: `${distanceInMiles.toFixed(1)} mi`,
          };
        } catch (e) {
          return { ...shop, distanceText: undefined };
        }
      }
      return { ...shop, distanceText: undefined };
    });
  } else {
    shopsWithDistance = filteredShops.map(shop => ({
      ...shop,
      distanceText: undefined,
    }));
  }

  // 5. Sort by distance if available
  if (shopsWithDistance.some(shop => shop.distance !== undefined)) {
    shopsWithDistance.sort(
      (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
    );
  }

  return shopsWithDistance;
}
