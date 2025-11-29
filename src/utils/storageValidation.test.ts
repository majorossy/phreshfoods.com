// src/utils/storageValidation.test.ts
/**
 * Tests for storage validation - LocalStorage safety and versioning
 *
 * Tests the exported functions: getTripFromStorage, saveTripToStorage,
 * clearTripFromStorage, getStorageSize, isStorageAvailable
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getTripFromStorage,
  saveTripToStorage,
  clearTripFromStorage,
  getStorageSize,
  isStorageAvailable,
} from './storageValidation';
import type { Shop } from '../types';

const validShop: Shop = {
  type: 'farm_stand',
  Name: 'Test Farm',
  Address: '123 Main St',
  slug: 'test-farm',
  lat: 43.6591,
  lng: -70.2568,
  products: { beef: true },
};

const validShop2: Shop = {
  type: 'cheese_shop',
  Name: 'Test Cheese',
  Address: '456 Cheese St',
  slug: 'test-cheese',
  lat: 43.6600,
  lng: -70.2500,
  products: { cheddar: true },
};

describe('Storage Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('saveTripToStorage', () => {
    it('should save trip stops to localStorage', () => {
      const result = saveTripToStorage('test_trip', [validShop]);

      expect(result).toBe(true);

      const saved = localStorage.getItem('test_trip');
      expect(saved).toBeTruthy();
    });

    it('should save with version and timestamp', () => {
      saveTripToStorage('test_trip', [validShop]);

      const saved = JSON.parse(localStorage.getItem('test_trip') || '{}');

      expect(saved.version).toBe(1);
      expect(saved.timestamp).toBeDefined();
      expect(typeof saved.timestamp).toBe('number');
    });

    it('should save trip stops array', () => {
      saveTripToStorage('test_trip', [validShop, validShop2]);

      const saved = JSON.parse(localStorage.getItem('test_trip') || '{}');

      expect(saved.tripStops.length).toBe(2);
      expect(saved.tripStops[0].Name).toBe('Test Farm');
      expect(saved.tripStops[1].Name).toBe('Test Cheese');
    });

    it('should handle empty trip stops array', () => {
      const result = saveTripToStorage('test_trip', []);

      expect(result).toBe(true);

      const saved = JSON.parse(localStorage.getItem('test_trip') || '{}');
      expect(saved.tripStops).toEqual([]);
    });

    it('should overwrite existing data', () => {
      saveTripToStorage('test_trip', [validShop]);
      saveTripToStorage('test_trip', [validShop2]);

      const saved = JSON.parse(localStorage.getItem('test_trip') || '{}');

      expect(saved.tripStops.length).toBe(1);
      expect(saved.tripStops[0].Name).toBe('Test Cheese');
    });

    it('should filter out invalid shops', () => {
      const invalidShop = { foo: 'bar' } as unknown as Shop;

      saveTripToStorage('test_trip', [validShop, invalidShop]);

      const saved = JSON.parse(localStorage.getItem('test_trip') || '{}');

      // Should only contain the valid shop
      expect(saved.tripStops.length).toBe(1);
      expect(saved.tripStops[0].Name).toBe('Test Farm');
    });
  });

  describe('getTripFromStorage', () => {
    it('should return null for missing key', () => {
      const result = getTripFromStorage('nonexistent_key');

      expect(result).toBe(null);
    });

    it('should return trip stops from valid storage', () => {
      saveTripToStorage('test_trip', [validShop, validShop2]);

      const result = getTripFromStorage('test_trip');

      expect(result).not.toBeNull();
      expect(result?.length).toBe(2);
      expect(result?.[0].Name).toBe('Test Farm');
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('test_trip', 'invalid json{{{');

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = getTripFromStorage('test_trip');

      expect(result).toBe(null);

      consoleSpy.mockRestore();
    });

    it('should migrate legacy data (array without version)', () => {
      // Old format: just an array of shops
      localStorage.setItem('test_trip', JSON.stringify([validShop]));

      // Suppress console.warn for this test
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = getTripFromStorage('test_trip');

      // Should migrate and return shops
      expect(result).not.toBeNull();
      // After migration, storage should be updated with new format
      const saved = JSON.parse(localStorage.getItem('test_trip') || '{}');
      expect(saved.version).toBe(1);

      consoleSpy.mockRestore();
    });

    it('should remove corrupted data from storage', () => {
      localStorage.setItem('test_trip', 'invalid');

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      getTripFromStorage('test_trip');

      // Corrupted data should be removed
      expect(localStorage.getItem('test_trip')).toBe(null);

      consoleSpy.mockRestore();
    });
  });

  describe('clearTripFromStorage', () => {
    it('should remove trip data from storage', () => {
      saveTripToStorage('test_trip', [validShop]);

      clearTripFromStorage('test_trip');

      expect(localStorage.getItem('test_trip')).toBe(null);
    });

    it('should not throw for nonexistent key', () => {
      expect(() => {
        clearTripFromStorage('nonexistent_key');
      }).not.toThrow();
    });
  });

  describe('getStorageSize', () => {
    it('should return 0 for missing key', () => {
      const size = getStorageSize('nonexistent_key');

      expect(size).toBe(0);
    });

    it('should return positive size for stored data', () => {
      saveTripToStorage('test_trip', [validShop]);

      const size = getStorageSize('test_trip');

      expect(size).toBeGreaterThan(0);
    });

    it('should return larger size for more data', () => {
      saveTripToStorage('trip1', [validShop]);
      saveTripToStorage('trip2', [validShop, validShop2]);

      const size1 = getStorageSize('trip1');
      const size2 = getStorageSize('trip2');

      expect(size2).toBeGreaterThan(size1);
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      const result = isStorageAvailable();

      expect(result).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain shop data through save/load cycle', () => {
      saveTripToStorage('test_trip', [validShop]);
      const loaded = getTripFromStorage('test_trip');

      expect(loaded?.[0].Name).toBe(validShop.Name);
      expect(loaded?.[0].slug).toBe(validShop.slug);
      expect(loaded?.[0].lat).toBe(validShop.lat);
      expect(loaded?.[0].lng).toBe(validShop.lng);
      expect(loaded?.[0].type).toBe(validShop.type);
    });

    it('should preserve order of shops', () => {
      saveTripToStorage('test_trip', [validShop, validShop2]);
      const loaded = getTripFromStorage('test_trip');

      expect(loaded?.[0].Name).toBe('Test Farm');
      expect(loaded?.[1].Name).toBe('Test Cheese');
    });
  });
});
