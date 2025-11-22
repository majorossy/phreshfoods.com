// src/services/apiService.ts
'use strict';

import { Shop, PlaceDetails, GeoLocation } from '../types'; // Assuming your types are in ../types
import { retryAsync } from '../utils/retry';
import { cachedFetch } from '../utils/requestCache';
import {
  API_RETRY_FARM_STANDS_MAX,
  API_RETRY_FARM_STANDS_DELAY_MS,
  API_RETRY_GEOCODE_MAX,
  API_RETRY_GEOCODE_DELAY_MS,
} from '../config/appConfig';

// Define a type for the raw shop data from the backend if it differs slightly before client-side processing
// For now, we'll assume the backend sends data largely conforming to the Shop type,
// but we might need to parse numbers or booleans.
interface RawShopData extends Omit<Shop, 'lat' | 'lng' | 'beef' /* ... other booleans ... */> {
  lat?: string | number | null;
  lng?: string | number | null;
  lat_from_sheet?: string | number | null;
  lng_from_sheet?: string | number | null;
  // Product keys might come as strings "true"/"false" or 1/0 from some backends
  beef?: string | boolean | number;
  pork?: string | boolean | number;
  lamb?: string | boolean | number;
  chicken?: string | boolean | number;
  turkey?: string | boolean | number;
  duck?: string | boolean | number;
  eggs?: string | boolean | number;
  corn?: string | boolean | number;
  carrots?: string | boolean | number;
  potatoes?: string | boolean | number;
  lettuce?: string | boolean | number;
  spinach?: string | boolean | number;
  squash?: string | boolean | number;
  tomatoes?: string | boolean | number;
  peppers?: string | boolean | number;
  cucumbers?: string | boolean | number;
  zucchini?: string | boolean | number;
  garlic?: string | boolean | number;
  onions?: string | boolean | number;
  strawberries?: string | boolean | number;
  blueberries?: string | boolean | number;
  // Add other product keys here
}


/**
 * Converts various truthy/falsy values to boolean with strict validation
 * @param value - The value to convert
 * @param fieldName - Optional field name for error logging
 * @returns boolean value
 */
const toBoolean = (value: string | boolean | number | undefined | null, fieldName?: string): boolean => {
  // Handle boolean directly
  if (typeof value === 'boolean') return value;

  // Handle numbers (1 = true, 0 = false, anything else is suspicious)
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    // Log unexpected numeric values in development
    if (import.meta.env.DEV && fieldName) {
      console.warn(`[apiService] Unexpected numeric value for ${fieldName}: ${value}, treating as false`);
    }
    return false;
  }

  // Handle strings
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false; // Empty string = false

    const lower = trimmed.toLowerCase();
    const truthyValues = ['true', '1', 'yes', 't', 'x', 'available'];
    const falsyValues = ['false', '0', 'no', 'f', 'n/a', 'unavailable'];

    if (truthyValues.includes(lower)) return true;
    if (falsyValues.includes(lower)) return false;

    // Log unrecognized string values in development
    if (import.meta.env.DEV && fieldName) {
      console.warn(`[apiService] Unrecognized value for ${fieldName}: "${value}", treating as false`);
    }
    return false;
  }

  // Null or undefined = false
  return false;
};

/**
 * Fetches and processes all location data (farm stands + cheese shops) from the server backend.
 * Uses request caching to prevent duplicate calls and improve performance.
 *
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation
 * @returns {Promise<Shop[]>} A promise that resolves to an array of location objects.
 */
export async function fetchAndProcessLocations(signal?: AbortSignal): Promise<Shop[]> {
  try {
    // Use cachedFetch with 5-minute cache duration
    // This prevents duplicate requests during React Strict Mode and hot reloading
    const rawData = await cachedFetch<Shop[]>(
      '/api/locations',
      { signal }, // Pass abort signal to fetch
      300000 // 5 minutes cache (locations update hourly)
    );

    // Process the data
    let processedData: Shop[] = [];
    if (Array.isArray(rawData)) {
      processedData = rawData as Shop[];
    }

    return processedData;

  } catch (error) {
    // Don't log errors for aborted requests
    if (error instanceof Error && error.name === 'AbortError') {
      return [];
    }
    return []; // ALWAYS return an array, even on error
  }
}

/**
 * Fetches and processes farm stand data from the server backend (backward compatibility).
 * Uses request caching to prevent duplicate calls and improve performance.
 *
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation
 * @returns {Promise<Shop[]>} A promise that resolves to an array of shop objects.
 */
export async function fetchAndProcessFarmStands(signal?: AbortSignal): Promise<Shop[]> {
  try {
    // Use cachedFetch with 5-minute cache duration
    // This prevents duplicate requests during React Strict Mode and hot reloading
    const rawData = await cachedFetch<Shop[]>(
      '/api/farm-stands',
      { signal }, // Pass abort signal to fetch
      300000 // 5 minutes cache (farm stands update hourly)
    );

    // Process the data
    let processedData: Shop[] = [];
    if (Array.isArray(rawData)) {
      processedData = rawData as Shop[];
    }

    return processedData;

  } catch (error) {
    // Don't log errors for aborted requests
    if (error instanceof Error && error.name === 'AbortError') {
      return [];
    }
    return []; // ALWAYS return an array, even on error
  }
}

/**
 * Type for the backend geocode response.
 * Note: Google's GeocoderResult is very complex. This is a simplified version.
 */
export interface GeocodeResponse extends GeoLocation {
  viewport?: {
    northeast: GeoLocation;
    southwest: GeoLocation;
  };
  formatted_address?: string;
  place_id?: string;
  name?: string; // Sometimes geocoding can give a name
  types?: string[];
}

/**
 * Fetches geocoded location data from the backend API.
 * @param {string} address - The address string to geocode.
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation
 * @returns {Promise<GeocodeResponse | null>} A promise that resolves to a location object or null on failure.
 */
export async function geocodeAddressClient(address: string, signal?: AbortSignal): Promise<GeocodeResponse | null> {
  if (!address || typeof address !== 'string' || address.trim() === "") {
    return null;
  }
  try {
    return await retryAsync(async () => {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`, { signal });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Geocoding request failed" }));
        throw new Error(
          (errorData as { error?: string }).error ||
          `Geocoding request failed: ${response.statusText}`
        );
      }
      return await response.json() as GeocodeResponse;
    }, {
      maxRetries: API_RETRY_GEOCODE_MAX,
      delayMs: API_RETRY_GEOCODE_DELAY_MS,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    return null;
  }
}

/**
 * Fetches Google Place Details from the backend API.
 * The backend's /api/places/details should return data conforming to our PlaceDetails type (or a subset).
 * @param {string} placeId - The Google Place ID.
 * @param {string} [fields] - Optional comma-separated string of fields to request.
 * @returns {Promise<Partial<PlaceDetails> | null>} A promise that resolves to the place details object or null on failure.
 *                                                Using Partial<PlaceDetails> because the client might request specific fields.
 */
export async function getPlaceDetailsClient(placeId: string, fields?: string): Promise<Partial<PlaceDetails> | null> {
  if (!placeId) {
    return null;
  }
  try {
    return await retryAsync(async () => {
      const fieldQuery = fields ? `&fields=${encodeURIComponent(fields)}` : '';
      const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}${fieldQuery}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Fetching place details failed" }));
        throw new Error(
          (errorData as { error?: string }).error ||
          `Place details request failed: ${response.statusText}`
        );
      }
      return await response.json() as Partial<PlaceDetails>;
    }, {
      maxRetries: API_RETRY_GEOCODE_MAX,
      delayMs: API_RETRY_GEOCODE_DELAY_MS,
    });
  } catch (error) {
    return null;
  }
}

/**
 * Type for Google Directions API response (highly simplified).
 * In a real app, you'd use types from `@googlemaps/google-maps-services-js` if calling directly,
 * or define more comprehensive types for your backend's proxy response.
 */
export interface DirectionsResponse {
  status: string; // e.g., "OK", "ZERO_RESULTS"
  routes: google.maps.DirectionsRoute[]; // Google Maps DirectionsRoute objects
  // geocoded_waypoints?: google.maps.GeocoderResult[];
  // available_travel_modes?: google.maps.TravelMode[];
  error_message?: string; // If status is not OK
}

/**
 * Fetches driving directions from the backend API.
 * @param {string | GeoLocation} origin - The starting point (address or lat,lng object).
 * @param {string | GeoLocation | {placeId: string}} destination - The ending point (address, lat,lng, or place_id object).
 * @returns {Promise<DirectionsResponse | null>} A promise that resolves to the Google Directions result object or null on failure.
 */
export async function getDirectionsClient(
  origin: string | GeoLocation,
  destination: string | GeoLocation | { placeId: string }
): Promise<DirectionsResponse | null> {
  if (!origin || !destination) {
    return null;
  }

  const originQuery = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
  let destinationQuery: string;
  if (typeof destination === 'string') {
    destinationQuery = destination;
  } else if ('placeId' in destination) {
    destinationQuery = `place_id:${destination.placeId}`;
  } else {
    destinationQuery = `${destination.lat},${destination.lng}`;
  }

  try {
    return await retryAsync(async () => {
      const response = await fetch(`/api/directions?origin=${encodeURIComponent(originQuery)}&destination=${encodeURIComponent(destinationQuery)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Fetching directions failed" }));
        const errorMessage = (errorData as { error?: string; details?: string }).error ||
                             (errorData as { error?: string; details?: string }).details ||
                             `Directions request failed: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      return await response.json() as DirectionsResponse;
    }, {
      maxRetries: API_RETRY_GEOCODE_MAX,
      delayMs: API_RETRY_GEOCODE_DELAY_MS,
    });
  } catch (error) {
    return null;
  }
}