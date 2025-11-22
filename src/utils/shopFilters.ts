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

  // 2. Apply Location/Radius Filter
  if (
    options.mapsApiReady &&
    window.google?.maps?.geometry?.spherical &&
    options.location?.geometry?.location &&
    options.radius > 0
  ) {
    const placeLocation = options.location.geometry.location;
    let searchCenterLat: number | undefined;
    let searchCenterLng: number | undefined;

    if (
      placeLocation &&
      typeof placeLocation.lat === 'function' &&
      typeof placeLocation.lng === 'function'
    ) {
      searchCenterLat = placeLocation.lat();
      searchCenterLng = placeLocation.lng();
    } else if (
      placeLocation &&
      typeof placeLocation.lat === 'number' &&
      typeof placeLocation.lng === 'number'
    ) {
      searchCenterLat = placeLocation.lat;
      searchCenterLng = placeLocation.lng;
    }

    if (searchCenterLat !== undefined && searchCenterLng !== undefined) {
      const searchCenterLatLng = new window.google.maps.LatLng(
        searchCenterLat,
        searchCenterLng
      );
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
  }

  // 3. Calculate Distances and Format for Display
  let shopsWithDistance: ShopWithDistance[] = [];

  if (
    options.mapsApiReady &&
    window.google?.maps?.geometry?.spherical &&
    options.location?.geometry?.location
  ) {
    const placeLocation = options.location.geometry.location;
    let searchCenterLat: number | undefined;
    let searchCenterLng: number | undefined;

    if (
      placeLocation &&
      typeof placeLocation.lat === 'function' &&
      typeof placeLocation.lng === 'function'
    ) {
      searchCenterLat = placeLocation.lat();
      searchCenterLng = placeLocation.lng();
    } else if (
      placeLocation &&
      typeof placeLocation.lat === 'number' &&
      typeof placeLocation.lng === 'number'
    ) {
      searchCenterLat = placeLocation.lat;
      searchCenterLng = placeLocation.lng;
    }

    if (searchCenterLat !== undefined && searchCenterLng !== undefined) {
      const searchCenterLatLng = new window.google.maps.LatLng(
        searchCenterLat,
        searchCenterLng
      );

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
  } else {
    shopsWithDistance = filteredShops.map(shop => ({
      ...shop,
      distanceText: undefined,
    }));
  }

  // 4. Sort by distance if available
  if (shopsWithDistance.some(shop => shop.distance !== undefined)) {
    shopsWithDistance.sort(
      (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
    );
  }

  return shopsWithDistance;
}
