// src/types/trip.ts
import { Shop } from './shop';

/**
 * Represents a single stop in a trip
 */
export interface TripStop {
  shop: Shop;
  order: number;
  id: string; // Unique ID for this stop in the trip (for drag-and-drop)
}

/**
 * Serialized trip data for localStorage persistence
 * Now includes version for migration support
 */
export interface TripPersistence {
  stopSlugs: string[]; // Array of shop slugs in order
  isOptimizedRoute: boolean;
  timestamp: number;
  version?: number; // Added for versioning
}

/**
 * URL encoding format for trip sharing
 */
export interface TripUrlParams {
  trip: string; // Comma-separated shop slugs
  opt?: string; // '1' if optimized route
}

/**
 * Helper to encode trip as URL params
 */
export function encodeTripToUrl(stops: TripStop[], isOptimized: boolean): string {
  const slugs = stops.map(stop => stop.shop.slug).join(',');
  const params = new URLSearchParams();
  params.set('trip', slugs);
  if (isOptimized) {
    params.set('opt', '1');
  }
  return `?${params.toString()}`;
}

/**
 * Helper to decode trip from URL params
 */
export function decodeTripFromUrl(searchParams: URLSearchParams): { slugs: string[]; isOptimized: boolean } | null {
  const tripParam = searchParams.get('trip');
  if (!tripParam) {
    return null;
  }

  const slugs = tripParam.split(',').filter(s => s.trim().length > 0);
  const isOptimized = searchParams.get('opt') === '1';

  return { slugs, isOptimized };
}

/**
 * Helper to save trip to localStorage
 */
export function saveTripToLocalStorage(stops: TripStop[], isOptimized: boolean): void {
  const data: TripPersistence = {
    stopSlugs: stops.map(stop => stop.shop.slug),
    isOptimizedRoute: isOptimized,
    timestamp: Date.now()
  };
  localStorage.setItem('phreshfoods_trip_planner', JSON.stringify(data));
}

/**
 * Helper to load trip from localStorage
 */
export function loadTripFromLocalStorage(): TripPersistence | null {
  try {
    const stored = localStorage.getItem('phreshfoods_trip_planner');
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as TripPersistence;
  } catch (error) {
    console.error('Failed to load trip from localStorage:', error);
    return null;
  }
}

/**
 * Helper to clear trip from localStorage
 */
export function clearTripFromLocalStorage(): void {
  localStorage.removeItem('phreshfoods_trip_planner');
}
