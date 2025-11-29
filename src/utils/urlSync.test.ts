// src/utils/urlSync.test.ts
/**
 * Tests for URL synchronization utilities
 *
 * The URL sync system encodes filter state to/from URL query params:
 * - products: comma-separated product keys (beef,eggs,tomatoes)
 * - lat, lng: search location coordinates
 * - radius: search radius in miles
 *
 * Note: Location types are now in the URL path (/farm-stand), not query params
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FILTER_STATE,
  parseFiltersFromURL,
  encodeFiltersToURL,
} from './urlSync';
import type { URLFilterState } from './urlSync';

describe('urlSync Utilities', () => {
  describe('DEFAULT_FILTER_STATE', () => {
    it('should have all location types selected', () => {
      expect(DEFAULT_FILTER_STATE.locationTypes.size).toBeGreaterThan(0);
    });

    it('should have no product filters active', () => {
      expect(DEFAULT_FILTER_STATE.productFilters).toEqual({});
    });

    it('should have null search location', () => {
      expect(DEFAULT_FILTER_STATE.searchLocation).toBe(null);
    });

    it('should have default radius of 25 miles', () => {
      expect(DEFAULT_FILTER_STATE.searchRadius).toBe(25);
    });
  });

  describe('parseFiltersFromURL', () => {
    it('should parse product filters from query params', () => {
      // Module uses 'products' param, not 'filters'
      const searchParams = new URLSearchParams('?products=beef,eggs,tomatoes');

      const state = parseFiltersFromURL(searchParams);

      expect(state.productFilters.beef).toBe(true);
      expect(state.productFilters.eggs).toBe(true);
      expect(state.productFilters.tomatoes).toBe(true);
    });

    it('should parse search radius from query params', () => {
      const searchParams = new URLSearchParams('?radius=50');

      const state = parseFiltersFromURL(searchParams);

      expect(state.searchRadius).toBe(50);
    });

    it('should parse lat/lng from query params', () => {
      const searchParams = new URLSearchParams('?lat=43.6591&lng=-70.2568');

      const state = parseFiltersFromURL(searchParams);

      expect(state.searchLocation).toBeTruthy();
      if (state.searchLocation) {
        // searchLocation uses geometry.location structure
        expect(state.searchLocation.geometry?.location.lat).toBe(43.6591);
        expect(state.searchLocation.geometry?.location.lng).toBe(-70.2568);
      }
    });

    it('should handle empty query params', () => {
      const searchParams = new URLSearchParams('');

      const state = parseFiltersFromURL(searchParams);

      expect(state.productFilters).toEqual({});
      expect(state.searchRadius).toBe(25); // Default
      expect(state.searchLocation).toBe(null);
    });

    it('should handle malformed filter params', () => {
      const searchParams = new URLSearchParams('?products=invalid,,,');

      const state = parseFiltersFromURL(searchParams);

      // Should handle gracefully - 'invalid' is a valid key, empty strings are filtered
      expect(state.productFilters).toBeTruthy();
    });

    it('should handle invalid radius values', () => {
      const searchParams = new URLSearchParams('?radius=invalid');

      const state = parseFiltersFromURL(searchParams);

      // Should fall back to default
      expect(state.searchRadius).toBe(25);
    });

    it('should handle negative radius', () => {
      const searchParams = new URLSearchParams('?radius=-10');

      const state = parseFiltersFromURL(searchParams);

      // Should use default since -10 < 5 (min)
      expect(state.searchRadius).toBe(25);
    });

    it('should handle radius > max', () => {
      const searchParams = new URLSearchParams('?radius=999');

      const state = parseFiltersFromURL(searchParams);

      // Should use default since 999 > 100 (max)
      expect(state.searchRadius).toBe(25);
    });

    it('should handle incomplete lat/lng', () => {
      const searchParams = new URLSearchParams('?lat=43.6591');

      const state = parseFiltersFromURL(searchParams);

      // Should require both lat and lng
      expect(state.searchLocation).toBe(null);
    });

    it('should parse multiple filters correctly', () => {
      const searchParams = new URLSearchParams('?products=beef,pork,chicken,eggs');

      const state = parseFiltersFromURL(searchParams);

      expect(state.productFilters.beef).toBe(true);
      expect(state.productFilters.pork).toBe(true);
      expect(state.productFilters.chicken).toBe(true);
      expect(state.productFilters.eggs).toBe(true);
    });
  });

  describe('encodeFiltersToURL', () => {
    it('should encode product filters to query string', () => {
      const state: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        productFilters: { beef: true, eggs: true },
      };

      const params = encodeFiltersToURL(state);
      const queryString = params.toString();

      expect(queryString).toContain('products=');
      expect(queryString).toContain('beef');
      expect(queryString).toContain('eggs');
    });

    it('should encode radius to query string', () => {
      const state: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        searchRadius: 50,
      };

      const params = encodeFiltersToURL(state);
      const queryString = params.toString();

      expect(queryString).toContain('radius=50');
    });

    it('should encode lat/lng to query string', () => {
      const state: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        searchLocation: {
          name: 'Portland',
          formatted_address: 'Portland, ME',
          geometry: {
            location: { lat: 43.6591, lng: -70.2568 },
            viewport: undefined,
          },
          place_id: undefined,
          address_components: undefined,
          types: undefined,
        },
      };

      const params = encodeFiltersToURL(state);
      const queryString = params.toString();

      // Note: encodeSearchLocation rounds to 2 decimal places
      expect(queryString).toContain('lat=43.66');
      expect(queryString).toContain('lng=-70.26');
    });

    it('should return empty string for default state', () => {
      const params = encodeFiltersToURL(DEFAULT_FILTER_STATE);
      const queryString = params.toString();

      // Default state should produce empty query string
      expect(queryString).toBe('');
    });

    it('should handle state with no active filters', () => {
      const state: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        productFilters: {},
      };

      const params = encodeFiltersToURL(state);
      const queryString = params.toString();

      expect(queryString).not.toContain('products=');
    });

    it('should URL-encode filter names if needed', () => {
      const state: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        productFilters: { 'special name': true },
      };

      const params = encodeFiltersToURL(state);
      const queryString = params.toString();

      // Should be parseable even with special characters
      expect(() => new URLSearchParams(queryString)).not.toThrow();
    });
  });

  describe('Round-trip Encoding/Decoding', () => {
    it('should preserve state through encode → decode cycle', () => {
      const originalState: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        productFilters: { beef: true, eggs: true, tomatoes: true },
        searchRadius: 30,
        searchLocation: {
          name: 'Portland',
          formatted_address: 'Portland, ME',
          geometry: {
            location: { lat: 43.6591, lng: -70.2568 },
            viewport: undefined,
          },
          place_id: undefined,
          address_components: undefined,
          types: undefined,
        },
      };

      const params = encodeFiltersToURL(originalState);
      const decodedState = parseFiltersFromURL(params);

      expect(decodedState.productFilters.beef).toBe(true);
      expect(decodedState.productFilters.eggs).toBe(true);
      expect(decodedState.productFilters.tomatoes).toBe(true);
      expect(decodedState.searchRadius).toBe(30);
      // Lat/lng are rounded to 2 decimal places on encoding
      expect(decodedState.searchLocation?.geometry?.location.lat).toBeCloseTo(43.66, 1);
      expect(decodedState.searchLocation?.geometry?.location.lng).toBeCloseTo(-70.26, 1);
    });

    it('should handle edge case values', () => {
      const edgeState: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        searchRadius: 5, // Min radius
        productFilters: {}, // No filters
      };

      const params = encodeFiltersToURL(edgeState);
      const decodedState = parseFiltersFromURL(params);

      // radius=5 should be in params since it differs from default (25)
      expect(decodedState.searchRadius).toBe(5);
      expect(decodedState.productFilters).toEqual({});
    });
  });

  describe('Query Parameter Format', () => {
    it('should use comma-separated values for filters', () => {
      const state: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        productFilters: { beef: true, pork: true, chicken: true },
      };

      const params = encodeFiltersToURL(state);
      const productsParam = params.get('products');

      expect(productsParam).toBeTruthy();
      expect(productsParam).toContain(',');
    });

    it('should not include false filters', () => {
      const state: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        productFilters: { beef: true, pork: false },
      };

      const params = encodeFiltersToURL(state);
      const productsParam = params.get('products');

      expect(productsParam).toContain('beef');
      expect(productsParam).not.toContain('pork');
    });

    it('should produce valid URLSearchParams', () => {
      const state: URLFilterState = {
        ...DEFAULT_FILTER_STATE,
        productFilters: { beef: true },
        searchRadius: 40,
      };

      const params = encodeFiltersToURL(state);

      // Should be a valid URLSearchParams instance
      expect(params instanceof URLSearchParams).toBe(true);
      // Should be parseable
      expect(() => new URLSearchParams(params.toString())).not.toThrow();
    });
  });
});
