// src/hooks/useFilteredShops.ts
import { useMemo } from 'react';
import { Shop, ShopWithDistance, AutocompletePlace, LocationType } from '../types';
import { filterAndSortShops } from '../utils/shopFilters';

interface UseFilteredShopsOptions {
  allFarmStands: Shop[] | undefined;
  activeProductFilters: Record<string, boolean> | undefined;
  activeLocationTypes: Set<LocationType> | undefined;
  searchLocation: AutocompletePlace | null;
  currentRadius: number;
  mapsApiReady: boolean;
}

/**
 * Custom hook for filtering and sorting shops
 *
 * Filters shops based on product availability and location/radius,
 * then sorts by distance from search location.
 *
 * @param options - Filter parameters
 * @returns Filtered and sorted shops with distance information
 */
export function useFilteredShops(options: UseFilteredShopsOptions): ShopWithDistance[] {
  const {
    allFarmStands,
    activeProductFilters,
    activeLocationTypes,
    searchLocation,
    currentRadius,
    mapsApiReady,
  } = options;

  return useMemo(() => {
    if (!allFarmStands || allFarmStands.length === 0) {
      return [];
    }

    return filterAndSortShops(allFarmStands, {
      productFilters: activeProductFilters || {},
      locationTypes: activeLocationTypes || new Set(['farm_stand', 'cheese_shop']),
      location: searchLocation,
      radius: currentRadius,
      mapsApiReady,
    });
  }, [allFarmStands, activeProductFilters, activeLocationTypes, searchLocation, currentRadius, mapsApiReady]);
}
