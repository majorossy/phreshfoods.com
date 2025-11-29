// src/utils/storageValidation.ts

import type { Shop } from '../types';

/**
 * Storage validation and versioning utilities for localStorage data.
 * Provides schema validation, version migration, and safe storage operations.
 */

// Storage version for migration purposes
const CURRENT_STORAGE_VERSION = 1;

interface StorageSchema {
  version: number;
  timestamp: number;
}

interface TripStorageData extends StorageSchema {
  tripStops: Shop[];
  tripName?: string;
}

/**
 * Validates that an object matches the expected Shop interface structure.
 * This prevents corrupted data from causing runtime errors.
 */
function isValidShop(data: any): data is Shop {
  if (!data || typeof data !== 'object') return false;

  // Check required fields
  const requiredFields = ['Name', 'slug', 'lat', 'lng', 'type'];
  for (const field of requiredFields) {
    if (!(field in data)) return false;
  }

  // Validate coordinate types
  if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return false;
  if (data.lat < -90 || data.lat > 90) return false;
  if (data.lng < -180 || data.lng > 180) return false;

  // Validate string fields
  if (typeof data.Name !== 'string' || typeof data.slug !== 'string') return false;
  if (typeof data.type !== 'string') return false;

  // Validate type enum
  const validTypes = ['farm_stand', 'cheese_shop', 'fish_monger', 'butcher', 'antique_shop', 'brewery', 'winery', 'sugar_shack'];
  if (!validTypes.includes(data.type)) return false;

  return true;
}

/**
 * Validates trip storage data structure.
 */
function isValidTripData(data: any): data is TripStorageData {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.version !== 'number') return false;
  if (typeof data.timestamp !== 'number') return false;
  if (!Array.isArray(data.tripStops)) return false;

  // Validate each shop in the trip
  return data.tripStops.every(isValidShop);
}

/**
 * Migrates storage data from older versions to the current version.
 * Add migration logic here as the schema evolves.
 */
function migrateStorageData(data: any, fromVersion: number): TripStorageData | null {
  try {
    // Handle version 0 (no version field) to version 1
    if (fromVersion === 0) {
      // Assume old data is just an array of shops
      if (Array.isArray(data)) {
        return {
          version: CURRENT_STORAGE_VERSION,
          timestamp: Date.now(),
          tripStops: data.filter(isValidShop),
        };
      }
    }

    // Future migrations would be added here
    // if (fromVersion === 1 && CURRENT_STORAGE_VERSION === 2) { ... }

    return null;
  } catch (error) {
    console.error('Storage migration failed:', error);
    return null;
  }
}

/**
 * Safely retrieves and validates trip data from localStorage.
 * Returns null if data is invalid or corrupted.
 */
export function getTripFromStorage(key: string): Shop[] | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Check if data has version field
    if (typeof parsed.version === 'undefined') {
      // Legacy data - attempt migration
      const migrated = migrateStorageData(parsed, 0);
      if (migrated) {
        // Save migrated data back to storage
        saveTripToStorage(key, migrated.tripStops);
        return migrated.tripStops;
      }
      return null;
    }

    // Validate current version data
    if (isValidTripData(parsed)) {
      // Check if migration is needed
      if (parsed.version < CURRENT_STORAGE_VERSION) {
        const migrated = migrateStorageData(parsed, parsed.version);
        if (migrated) {
          saveTripToStorage(key, migrated.tripStops);
          return migrated.tripStops;
        }
      }
      return parsed.tripStops;
    }

    // Data is corrupted - remove it
    console.warn(`Corrupted trip data detected in localStorage key '${key}'. Removing.`);
    localStorage.removeItem(key);
    return null;

  } catch (error) {
    console.error('Error reading trip from storage:', error);
    // Remove corrupted data
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors removing corrupted data
    }
    return null;
  }
}

/**
 * Safely saves trip data to localStorage with version and timestamp.
 */
export function saveTripToStorage(key: string, tripStops: Shop[]): boolean {
  try {
    // Validate shops before saving
    const validStops = tripStops.filter(isValidShop);

    const storageData: TripStorageData = {
      version: CURRENT_STORAGE_VERSION,
      timestamp: Date.now(),
      tripStops: validStops,
    };

    localStorage.setItem(key, JSON.stringify(storageData));
    return true;

  } catch (error) {
    // Handle quota exceeded or other storage errors
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Unable to save trip.');
      // Could implement cleanup of old data here
    } else {
      console.error('Error saving trip to storage:', error);
    }
    return false;
  }
}

/**
 * Clears trip data from storage.
 */
export function clearTripFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing trip from storage:', error);
  }
}

/**
 * Gets storage size for a specific key in bytes.
 * Useful for monitoring storage usage.
 */
export function getStorageSize(key: string): number {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return 0;
    // Rough estimate: 2 bytes per character (UTF-16)
    return stored.length * 2;
  } catch {
    return 0;
  }
}

/**
 * Checks if localStorage is available and working.
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}