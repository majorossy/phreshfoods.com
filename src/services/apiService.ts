// src/services/apiService.ts
'use strict';

import { Shop, PlaceDetails, GeoLocation } from '../types'; // Assuming your types are in ../types

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
  lettus?: string | boolean | number;
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


// Helper to convert various truthy/falsy string/number values to boolean
const toBoolean = (value: string | boolean | number | undefined | null): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes' || lower === 't' || lower === 'x' || lower === 'available';
  }
  return false;
};

/**
 * Fetches and processes farm stand data from the server backend.
 * @returns {Promise<Shop[]>} A promise that resolves to an array of shop objects.
 */
// Example structure for apiService.ts
export async function fetchAndProcessFarmStands(): Promise<Shop[]> {
  try {
    console.log("apiService: Initiating fetch from /api/farm-stands");
    const response = await fetch('/api/farm-stands'); // Or your actual endpoint
    console.log('apiService: Raw response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('apiService: Network response was not ok.', response.status, errorBody);
      throw new Error(`API request failed: ${response.status} ${errorBody}`);
    }

    const rawData = await response.json();
    console.log('apiService: Raw JSON data received:', rawData);

    // ---- YOUR DATA PROCESSING LOGIC ----
    // This is where rawData is transformed into Shop[]
    // For example, if rawData is an array of the correct shop objects:
    let processedData: Shop[] = [];
    if (Array.isArray(rawData)) { // Or whatever structure your API returns
        processedData = rawData as Shop[]; // Assuming direct cast or further mapping
        console.log(`apiService: Processed rawData into ${processedData.length} shops.`);
    } else {
        console.warn("apiService: rawData from API was not an array as expected.", rawData);
        // processedData will remain []
    }
    // ---- END OF YOUR DATA PROCESSING LOGIC ----


    if (processedData.length === 0) {
      // This is where your "Zero farm stands received" log comes from if processedData is empty
      console.warn('apiService: Processed data resulted in zero farm stands.');
    }
    return processedData; // Return the (possibly empty) array of Shops

  } catch (error) {
    console.error('apiService: Error within fetchAndProcessFarmStands:', error);
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
 * @returns {Promise<GeocodeResponse | null>} A promise that resolves to a location object or null on failure.
 */
export async function geocodeAddressClient(address: string): Promise<GeocodeResponse | null> {
  if (!address || typeof address !== 'string' || address.trim() === "") {
    console.warn("geocodeAddressClient: Invalid or empty address provided.");
    return null;
  }
  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Geocoding request failed" }));
      throw new Error(
        (errorData as { error?: string }).error ||
        `Geocoding request failed: ${response.statusText}`
      );
    }
    return await response.json() as GeocodeResponse;
  } catch (error) {
    console.error("Error geocoding address on client (via backend):", error instanceof Error ? error.message : String(error));
    // Optionally re-throw or return null based on how you want to handle errors in components
    // throw error;
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
    console.warn("getPlaceDetailsClient: No Place ID provided.");
    return null;
  }
  try {
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
  } catch (error) {
    console.error("Error fetching place details on client (via backend):", error instanceof Error ? error.message : String(error));
    // throw error;
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
  routes: any[]; // Define more strictly if needed
  // geocoded_waypoints?: any[];
  // available_travel_modes?: string[];
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
    console.warn("getDirectionsClient: Origin or destination missing.");
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
    const response = await fetch(`/api/directions?origin=${encodeURIComponent(originQuery)}&destination=${encodeURIComponent(destinationQuery)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Fetching directions failed" }));
      // The backend /api/directions might return different status codes for directions errors (e.g., 400 for bad request)
      // vs server errors (500). Handle accordingly.
      const errorMessage = (errorData as { error?: string; details?: string }).error ||
                           (errorData as { error?: string; details?: string }).details ||
                           `Directions request failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }
    return await response.json() as DirectionsResponse;
  } catch (error) {
    console.error("Error fetching directions on client (via backend):", error instanceof Error ? error.message : String(error));
    // throw error;
    return null;
  }
}