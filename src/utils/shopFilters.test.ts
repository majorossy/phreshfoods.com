// src/utils/shopFilters.test.ts
/**
 * BEGINNER'S GUIDE TO THIS TEST FILE
 * ===================================
 *
 * This test file verifies that the shop filtering and sorting logic works correctly.
 * It's testing a PURE FUNCTION - meaning given the same inputs, it always returns
 * the same outputs. No side effects, no network calls, no database - just logic.
 *
 * These are the EASIEST tests to write and understand, which is why we start here!
 *
 * TEST STRUCTURE:
 * ---------------
 * describe() - Groups related tests together
 * it() or test() - Individual test case
 * expect() - Makes an assertion about what should be true
 *
 * COMMON MATCHERS:
 * ---------------
 * .toBe() - Exact equality (like ===)
 * .toEqual() - Deep equality (compares object contents)
 * .toHaveLength() - Check array/string length
 * .toContain() - Check if array includes item
 * .toBeUndefined() - Check if value is undefined
 * .toBeTruthy() / .toBeFalsy() - Check truthiness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { filterAndSortShops, FilterOptions } from './shopFilters';
import { Shop } from '../types';
import { mockGoogleMaps, cleanupGoogleMaps } from '../test/mocks/googleMaps';

/**
 * Setup Google Maps mock before running tests
 * This runs ONCE before all tests in this file
 */
beforeEach(() => {
  // Set up the fake Google Maps API
  mockGoogleMaps();
});

/**
 * Clean up after tests
 */
afterEach(() => {
  cleanupGoogleMaps();
});

/**
 * HELPER: Create a fake shop for testing
 * This makes our tests more readable - instead of repeating all shop properties,
 * we can just specify what matters for each test
 */
function createMockShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: 1,
    Name: 'Test Farm',
    Address: '123 Main St',
    City: 'Portland',
    State: 'ME',
    Zip: '04101',
    lat: 43.6591, // Portland, Maine coordinates
    lng: -70.2568,
    slug: 'test-farm',
    type: 'farm', // Default location type

    // Default: no products available (all false)
    // Products are now in a nested object
    products: {
      strawberries: false,
      blueberries: false,
      eggs: false,
      beef: false,
      pork: false,
      chicken: false,
    },

    // Override any properties specified
    ...overrides,
  } as Shop;
}

/**
 * HELPER: Create default filter options
 * This is the standard configuration for most tests
 */
function createDefaultFilterOptions(overrides: Partial<FilterOptions> = {}): FilterOptions {
  return {
    productFilters: {}, // No product filters by default
    locationTypes: new Set(['farm']), // Default to farm stands
    location: {
      name: 'Portland, ME',
      formatted_address: 'Portland, ME, USA',
      geometry: {
        location: new google.maps.LatLng(43.6591, -70.2568), // Portland coords
      },
    },
    radius: 20, // 20 mile radius
    mapsApiReady: true,
    ...overrides,
  };
}

/**
 * TEST SUITE 1: Basic Functionality
 * ==================================
 * Testing the fundamentals - does it work at all?
 */
describe('shopFilters - Basic Functionality', () => {
  it('returns an empty array when given no shops', () => {
    // WHY THIS TEST: Edge case - what if there's no data?
    const options = createDefaultFilterOptions();

    const result = filterAndSortShops([], options);

    expect(result).toEqual([]); // Should return empty array, not crash
    expect(result).toHaveLength(0);
  });

  it('returns all shops when no filters are applied', () => {
    // WHY THIS TEST: Default behavior - show everything if user hasn't filtered
    const shops = [
      createMockShop({ id: 1, Name: 'Farm A' }),
      createMockShop({ id: 2, Name: 'Farm B' }),
      createMockShop({ id: 3, Name: 'Farm C' }),
    ];

    const options = createDefaultFilterOptions({
      productFilters: {}, // No filters
      location: null, // No location filter
    });

    const result = filterAndSortShops(shops, options);

    expect(result).toHaveLength(3); // All 3 shops should be returned
    expect(result.map(s => s.Name)).toEqual(['Farm A', 'Farm B', 'Farm C']);
  });

  it('adds distance information when location is provided', () => {
    // WHY THIS TEST: Users need to see "5.2 mi away" text
    const shop = createMockShop({
      Name: 'Nearby Farm',
      lat: 43.6591,
      lng: -70.2568, // Same as Portland (0 mi away)
    });

    const options = createDefaultFilterOptions(); // Portland location

    const result = filterAndSortShops([shop], options);

    expect(result[0].distance).toBeDefined(); // Distance in meters
    expect(result[0].distanceText).toBeDefined(); // Formatted text like "0.0 mi"
    expect(result[0].distance).toBeLessThan(100); // Less than 100 meters (basically same spot)
  });
});

/**
 * TEST SUITE 2: Product Filtering
 * ================================
 * Testing that product filters work correctly
 */
describe('shopFilters - Product Filtering', () => {
  it('filters shops by single product (strawberries)', () => {
    // WHY THIS TEST: Core feature - user clicks "strawberries" filter
    const shops = [
      createMockShop({ id: 1, Name: 'Strawberry Farm', products: { strawberries: true } }),
      createMockShop({ id: 2, Name: 'Blueberry Farm', products: { blueberries: true } }),
      createMockShop({ id: 3, Name: 'Berry Mix Farm', products: { strawberries: true, blueberries: true } }),
    ];

    const options = createDefaultFilterOptions({
      productFilters: { strawberries: true }, // Only show farms with strawberries
      location: null, // No distance filtering
    });

    const result = filterAndSortShops(shops, options);

    expect(result).toHaveLength(2); // Should get "Strawberry Farm" and "Berry Mix Farm"
    expect(result.map(s => s.Name)).toContain('Strawberry Farm');
    expect(result.map(s => s.Name)).toContain('Berry Mix Farm');
    expect(result.map(s => s.Name)).not.toContain('Blueberry Farm'); // Should NOT include this
  });

  it('filters shops by multiple products (AND logic)', () => {
    // WHY THIS TEST: User selects both "strawberries" AND "eggs"
    // Farm must have BOTH to show up
    const shops = [
      createMockShop({ id: 1, Name: 'Strawberry Only', products: { strawberries: true, eggs: false } }),
      createMockShop({ id: 2, Name: 'Eggs Only', products: { strawberries: false, eggs: true } }),
      createMockShop({ id: 3, Name: 'Both', products: { strawberries: true, eggs: true } }),
      createMockShop({ id: 4, Name: 'Neither', products: { strawberries: false, eggs: false } }),
    ];

    const options = createDefaultFilterOptions({
      productFilters: {
        strawberries: true,
        eggs: true
      }, // Must have BOTH
      location: null,
    });

    const result = filterAndSortShops(shops, options);

    // ONLY the farm with both products should appear
    expect(result).toHaveLength(1);
    expect(result[0].Name).toBe('Both');
  });

  it('shows all shops when all product filters are false', () => {
    // WHY THIS TEST: User cleared all filters - should see everything
    const shops = [
      createMockShop({ id: 1, Name: 'Farm A' }),
      createMockShop({ id: 2, Name: 'Farm B' }),
    ];

    const options = createDefaultFilterOptions({
      productFilters: {
        strawberries: false,
        blueberries: false,
        eggs: false,
      }, // All filters OFF
      location: null,
    });

    const result = filterAndSortShops(shops, options);

    expect(result).toHaveLength(2); // All shops visible
  });
});

/**
 * TEST SUITE 3: Distance/Radius Filtering
 * ========================================
 * Testing that location-based filtering works
 */
describe('shopFilters - Distance and Radius Filtering', () => {
  it('filters shops within radius', () => {
    // WHY THIS TEST: This is THE core feature - find farms near me!
    const shops = [
      createMockShop({
        id: 1,
        Name: 'Nearby Farm',
        lat: 43.6600,
        lng: -70.2600, // ~0.5 miles from Portland
      }),
      createMockShop({
        id: 2,
        Name: 'Far Farm',
        lat: 44.3000,
        lng: -69.0000, // ~70 miles from Portland
      }),
    ];

    const options = createDefaultFilterOptions({
      location: {
        formatted_address: 'Portland, ME, USA',
        geometry: {
          location: new google.maps.LatLng(43.6591, -70.2568),
        },
      },
      radius: 10, // 10 mile radius
    });

    const result = filterAndSortShops(shops, options);

    // Only "Nearby Farm" should pass the filter
    expect(result).toHaveLength(1);
    expect(result[0].Name).toBe('Nearby Farm');
  });

  it('excludes shops with invalid coordinates', () => {
    // WHY THIS TEST: Data quality - some farms might have missing/bad coordinates
    const shops = [
      createMockShop({ id: 1, Name: 'Valid Farm', lat: 43.6600, lng: -70.2600 }),
      createMockShop({ id: 2, Name: 'No Lat', lat: null as unknown as number, lng: -70.2600 }),
      createMockShop({ id: 3, Name: 'No Lng', lat: 43.6600, lng: null as unknown as number }),
      createMockShop({ id: 4, Name: 'NaN Coords', lat: NaN, lng: NaN }),
    ];

    const options = createDefaultFilterOptions({ radius: 10 });

    const result = filterAndSortShops(shops, options);

    // Only the farm with valid coordinates should appear
    expect(result).toHaveLength(1);
    expect(result[0].Name).toBe('Valid Farm');
  });

  it('sorts shops by distance (closest first)', () => {
    // WHY THIS TEST: UX - users want to see nearest farms first
    const shops = [
      createMockShop({
        id: 1,
        Name: 'Far Farm',
        lat: 43.7000,
        lng: -70.3000, // ~5 miles away
      }),
      createMockShop({
        id: 2,
        Name: 'Close Farm',
        lat: 43.6595,
        lng: -70.2570, // ~0.05 miles away
      }),
      createMockShop({
        id: 3,
        Name: 'Medium Farm',
        lat: 43.6800,
        lng: -70.2800, // ~2 miles away
      }),
    ];

    const options = createDefaultFilterOptions({ radius: 20 }); // All within radius

    const result = filterAndSortShops(shops, options);

    // Should be sorted by distance: Close, Medium, Far
    expect(result[0].Name).toBe('Close Farm');
    expect(result[1].Name).toBe('Medium Farm');
    expect(result[2].Name).toBe('Far Farm');

    // Verify distances are actually sorted
    expect(result[0].distance!).toBeLessThan(result[1].distance!);
    expect(result[1].distance!).toBeLessThan(result[2].distance!);
  });

  it('does not filter by radius when radius is 0', () => {
    // WHY THIS TEST: Edge case - radius of 0 should show all farms
    const shops = [
      createMockShop({ id: 1, Name: 'Farm A', lat: 43.6600, lng: -70.2600 }),
      createMockShop({ id: 2, Name: 'Farm B', lat: 44.3000, lng: -69.0000 }),
    ];

    const options = createDefaultFilterOptions({ radius: 0 }); // No radius filtering

    const result = filterAndSortShops(shops, options);

    expect(result).toHaveLength(2); // Both farms should appear
  });

  it('does not calculate distance when location is null', () => {
    // WHY THIS TEST: Performance - don't calculate distances if user hasn't searched
    const shops = [
      createMockShop({ id: 1, Name: 'Farm A' }),
    ];

    const options = createDefaultFilterOptions({
      location: null, // No search location
    });

    const result = filterAndSortShops(shops, options);

    expect(result[0].distance).toBeUndefined();
    expect(result[0].distanceText).toBeUndefined();
  });

  it('does not calculate distance when Maps API is not ready', () => {
    // WHY THIS TEST: Safety - don't try to use Google Maps if it hasn't loaded yet
    const shops = [
      createMockShop({ id: 1, Name: 'Farm A' }),
    ];

    const options = createDefaultFilterOptions({
      mapsApiReady: false, // Maps API not loaded
    });

    const result = filterAndSortShops(shops, options);

    expect(result[0].distance).toBeUndefined();
    expect(result[0].distanceText).toBeUndefined();
  });
});

/**
 * TEST SUITE 4: Combined Filters
 * ===============================
 * Testing that product AND distance filters work together
 */
describe('shopFilters - Combined Product and Distance Filtering', () => {
  it('applies both product and distance filters', () => {
    // WHY THIS TEST: Real-world usage - "show me strawberry farms within 10 miles"
    const shops = [
      createMockShop({
        id: 1,
        Name: 'Nearby Strawberry Farm',
        lat: 43.6600,
        lng: -70.2600,
        products: { strawberries: true },
      }),
      createMockShop({
        id: 2,
        Name: 'Far Strawberry Farm',
        lat: 44.3000,
        lng: -69.0000,
        products: { strawberries: true },
      }),
      createMockShop({
        id: 3,
        Name: 'Nearby Blueberry Farm',
        lat: 43.6600,
        lng: -70.2600,
        products: { blueberries: true },
      }),
    ];

    const options = createDefaultFilterOptions({
      productFilters: { strawberries: true }, // Only strawberries
      radius: 10, // Within 10 miles
    });

    const result = filterAndSortShops(shops, options);

    // Should only get the nearby strawberry farm
    expect(result).toHaveLength(1);
    expect(result[0].Name).toBe('Nearby Strawberry Farm');
  });

  it('returns empty array when no shops match all criteria', () => {
    // WHY THIS TEST: Edge case - user filters too narrowly
    const shops = [
      createMockShop({
        id: 1,
        Name: 'Nearby Farm (no strawberries)',
        lat: 43.6600,
        lng: -70.2600,
        products: { strawberries: false },
      }),
      createMockShop({
        id: 2,
        Name: 'Far Strawberry Farm',
        lat: 44.3000,
        lng: -69.0000,
        products: { strawberries: true },
      }),
    ];

    const options = createDefaultFilterOptions({
      productFilters: { strawberries: true },
      radius: 5, // Very small radius
    });

    const result = filterAndSortShops(shops, options);

    expect(result).toHaveLength(0); // No farms match both criteria
  });
});

/**
 * TEST SUMMARY
 * ============
 *
 * What we tested:
 * ✅ Basic functionality (empty arrays, no filters, distance calculation)
 * ✅ Product filtering (single, multiple, AND logic)
 * ✅ Distance filtering (radius, sorting, invalid coords)
 * ✅ Combined filters (product + distance)
 * ✅ Edge cases (no data, null values, Maps API not ready)
 *
 * What we learned:
 * - How to structure tests with describe/it
 * - How to use expect() and matchers
 * - How to create helper functions for test data
 * - How to test pure functions
 * - How to mock external dependencies (Google Maps)
 *
 * Next steps:
 * - Run this test with: npm test shopFilters
 * - See it pass! 🎉
 * - Move on to testing API services (async/await)
 */
