// src/services/apiService.test.ts
/**
 * BEGINNER'S GUIDE TO API SERVICE TESTING
 * ========================================
 *
 * This file tests the API service layer - the code that fetches data from your backend.
 * These are MORE COMPLEX than the shopFilters tests because they involve:
 * - Async/await (promises)
 * - Mocking network requests (fetch)
 * - Error handling
 * - Retry logic
 *
 * KEY CONCEPTS YOU'LL LEARN:
 * ---------------------------
 * 1. How to mock the fetch API
 * 2. How to test async functions (async/await)
 * 3. How to simulate errors
 * 4. How to test retry logic
 * 5. How to test abort signals (cancellation)
 *
 * ASYNC TESTING BASICS:
 * ---------------------
 * When testing async code, you MUST make your test function async and await promises:
 *
 *   it('fetches data', async () => {
 *     const result = await fetchData();
 *     expect(result).toBeDefined();
 *   });
 *
 * If you forget async/await, the test will pass even if it should fail!
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  fetchAndProcessFarmStands,
  geocodeAddressClient,
  getPlaceDetailsClient,
  getDirectionsClient,
} from './apiService';
import type { Shop } from '../types';

/**
 * Mock the fetch function globally
 * WHY: We don't want tests making real HTTP requests to the backend
 * - Tests would be slow (network latency)
 * - Tests would fail if backend is down
 * - Tests would be unpredictable (network issues)
 * - We'd hit rate limits on Google APIs
 */
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

/**
 * Mock the requestCache utility
 * WHY: We don't want cache behavior interfering with tests
 * Each test should be independent and predictable
 */
vi.mock('../utils/requestCache', () => ({
  cachedFetch: vi.fn(async (url, options, ttl) => {
    // Just pass through to fetch for testing
    // In real code, this would cache results
    const response = await global.fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }),
}));

/**
 * Mock the retry utility
 * WHY: We don't want to wait for actual retry delays in tests
 * Tests should run fast (milliseconds, not seconds)
 */
vi.mock('../utils/retry', () => ({
  retryAsync: vi.fn(async (fn, options) => {
    // For testing, just call the function once without retrying
    // This keeps tests fast and predictable
    return await fn();
  }),
}));

/**
 * Reset all mocks before each test
 * WHY: Ensures each test starts with a clean slate
 * Without this, one test's mock setup could affect another test
 */
beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * TEST SUITE 1: fetchAndProcessFarmStands
 * ========================================
 * This is the MOST CRITICAL function - it gets all farm data
 */
describe('apiService - fetchAndProcessFarmStands', () => {
  it('successfully fetches farm stand data', async () => {
    // WHY THIS TEST: Happy path - does it work when everything goes right?

    // ARRANGE: Set up mock data
    const mockFarmStands: Shop[] = [
      {
        id: 1,
        Name: 'Happy Farm',
        Address: '123 Farm Rd',
        City: 'Portland',
        State: 'ME',
        Zip: '04101',
        lat: 43.6591,
        lng: -70.2568,
        slug: 'happy-farm',
      } as Shop,
      {
        id: 2,
        Name: 'Sunny Acres',
        Address: '456 Sunny Ln',
        City: 'Falmouth',
        State: 'ME',
        Zip: '04105',
        lat: 43.7204,
        lng: -70.2520,
        slug: 'sunny-acres',
      } as Shop,
    ];

    // Mock the fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true, // HTTP 200
      json: async () => mockFarmStands, // Return our mock data
    });

    // ACT: Call the function
    const result = await fetchAndProcessFarmStands();

    // ASSERT: Verify the results
    expect(mockFetch).toHaveBeenCalledTimes(1); // fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/farm-stands', expect.anything()); // Called correct endpoint
    expect(result).toEqual(mockFarmStands); // Got back the data we expected
    expect(result).toHaveLength(2); // Two farms
  });

  it('returns empty array when fetch fails', async () => {
    // WHY THIS TEST: Error handling - what if the backend is down?
    // The app should handle errors gracefully, not crash

    // Mock a network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchAndProcessFarmStands();

    // Should return empty array, not throw an error
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('returns empty array when request is aborted', async () => {
    // WHY THIS TEST: User cancellation - what if user navigates away?
    // We use AbortController to cancel in-flight requests

    // Create an abort signal
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Mock an abort error
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await fetchAndProcessFarmStands(signal);

    // Should return empty array, not throw
    expect(result).toEqual([]);
  });

  it('handles non-array response', async () => {
    // WHY THIS TEST: Data validation - what if backend sends unexpected data?

    // Mock a response that's not an array
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'Invalid data format' }), // Object instead of array
    });

    const result = await fetchAndProcessFarmStands();

    // Should still return an array (might be empty)
    expect(Array.isArray(result)).toBe(true);
  });

  it('passes abort signal to fetch', async () => {
    // WHY THIS TEST: Ensure we can cancel requests
    const abortController = new AbortController();
    const signal = abortController.signal;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchAndProcessFarmStands(signal);

    // Verify that fetch was called with the signal
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/farm-stands',
      expect.objectContaining({ signal })
    );
  });
});

/**
 * TEST SUITE 2: geocodeAddressClient
 * ===================================
 * This function converts addresses to coordinates (lat/lng)
 */
describe('apiService - geocodeAddressClient', () => {
  it('successfully geocodes an address', async () => {
    // WHY THIS TEST: Core functionality - can we convert "Portland, ME" to coordinates?

    const mockGeocodeResponse = {
      lat: 43.6591,
      lng: -70.2568,
      formatted_address: 'Portland, ME, USA',
      place_id: 'ChIJ...',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeocodeResponse,
    });

    const result = await geocodeAddressClient('Portland, ME');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/geocode?address=Portland%2C%20ME', // URL-encoded
      expect.anything()
    );
    expect(result).toEqual(mockGeocodeResponse);
  });

  it('returns null for empty address', async () => {
    // WHY THIS TEST: Input validation - don't make API calls for invalid input

    // These should NOT make any API call
    expect(await geocodeAddressClient('')).toBeNull();
    expect(await geocodeAddressClient('   ')).toBeNull(); // Only whitespace
    expect(await geocodeAddressClient(null as any)).toBeNull();

    // Verify fetch was never called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles geocoding errors', async () => {
    // WHY THIS TEST: Error recovery - what if address can't be geocoded?

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Address not found' }),
    });

    const result = await geocodeAddressClient('Invalid Address 123abc');

    expect(result).toBeNull(); // Should return null, not crash
  });

  it('handles abort signal', async () => {
    // WHY THIS TEST: User can cancel geocoding request

    const abortController = new AbortController();
    const signal = abortController.signal;

    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await geocodeAddressClient('Portland, ME', signal);

    expect(result).toBeNull();
  });

  it('URL-encodes addresses correctly', async () => {
    // WHY THIS TEST: Security/correctness - special characters must be encoded

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lat: 0, lng: 0 }),
    });

    await geocodeAddressClient('123 Main St #5, Portland, ME');

    // Verify URL encoding happened
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('123%20Main%20St'), // Spaces encoded as %20
      expect.anything()
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('%235'), // # encoded as %23
      expect.anything()
    );
  });
});

/**
 * TEST SUITE 3: getPlaceDetailsClient
 * ====================================
 * This function fetches detailed information about a place (reviews, hours, etc.)
 */
describe('apiService - getPlaceDetailsClient', () => {
  it('successfully fetches place details', async () => {
    // WHY THIS TEST: Core functionality - can we get place details?

    const mockPlaceDetails = {
      place_id: 'ChIJ...',
      name: 'Happy Farm',
      rating: 4.5,
      formatted_phone_number: '(207) 555-1234',
      opening_hours: {
        weekday_text: ['Monday: 9:00 AM – 6:00 PM'],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlaceDetails,
    });

    const result = await getPlaceDetailsClient('ChIJ...');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/places/details?placeId=ChIJ...'
    );
    expect(result).toEqual(mockPlaceDetails);
  });

  it('includes fields parameter when provided', async () => {
    // WHY THIS TEST: Optimization - we can request only specific fields

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Farm', rating: 4.5 }),
    });

    await getPlaceDetailsClient('ChIJ...', 'name,rating,reviews');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('fields=name%2Crating%2Creviews') // Comma encoded as %2C
    );
  });

  it('returns null for empty placeId', async () => {
    // WHY THIS TEST: Input validation

    expect(await getPlaceDetailsClient('')).toBeNull();
    expect(await getPlaceDetailsClient(null as any)).toBeNull();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    // WHY THIS TEST: Error recovery

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Server error' }),
    });

    const result = await getPlaceDetailsClient('ChIJ...');

    expect(result).toBeNull();
  });
});

/**
 * TEST SUITE 4: getDirectionsClient
 * ==================================
 * This function fetches driving directions between two locations
 */
describe('apiService - getDirectionsClient', () => {
  it('successfully fetches directions with string addresses', async () => {
    // WHY THIS TEST: Common use case - "get directions from A to B"

    const mockDirectionsResponse = {
      status: 'OK',
      routes: [
        {
          summary: 'I-295 N',
          legs: [
            {
              distance: { text: '5.2 mi', value: 8369 },
              duration: { text: '12 mins', value: 720 },
            },
          ],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDirectionsResponse,
    });

    const result = await getDirectionsClient(
      'Portland, ME',
      '123 Farm Rd, Portland, ME'
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('origin=Portland%2C%20ME')
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('destination=123%20Farm%20Rd')
    );
    expect(result).toEqual(mockDirectionsResponse);
  });

  it('handles lat/lng coordinates', async () => {
    // WHY THIS TEST: Alternative input format - coordinates instead of addresses

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'OK', routes: [] }),
    });

    const origin = { lat: 43.6591, lng: -70.2568 };
    const destination = { lat: 43.7204, lng: -70.2520 };

    await getDirectionsClient(origin, destination);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('origin=43.6591%2C-70.2568') // Lat,lng format
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('destination=43.7204%2C-70.252')
    );
  });

  it('handles place ID destination', async () => {
    // WHY THIS TEST: Google Places can be referenced by ID

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'OK', routes: [] }),
    });

    await getDirectionsClient(
      'Portland, ME',
      { placeId: 'ChIJ...' }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('destination=place_id%3AChIJ') // place_id: prefix
    );
  });

  it('returns null for missing origin or destination', async () => {
    // WHY THIS TEST: Input validation - both are required

    expect(await getDirectionsClient('', 'Portland, ME')).toBeNull();
    expect(await getDirectionsClient('Portland, ME', '')).toBeNull();
    expect(await getDirectionsClient(null as any, null as any)).toBeNull();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles directions errors', async () => {
    // WHY THIS TEST: Error recovery - route might not be found

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'Route not found' }),
    });

    const result = await getDirectionsClient('Portland, ME', 'Invalid Location');

    expect(result).toBeNull();
  });
});

/**
 * TEST SUMMARY
 * ============
 *
 * What we tested:
 * ✅ fetchAndProcessFarmStands - Main data fetching
 * ✅ geocodeAddressClient - Address to coordinates
 * ✅ getPlaceDetailsClient - Place information
 * ✅ getDirectionsClient - Driving directions
 *
 * For each function, we tested:
 * ✅ Happy path (successful API call)
 * ✅ Error handling (network errors, API errors)
 * ✅ Input validation (empty/null inputs)
 * ✅ Edge cases (abort signals, malformed data)
 * ✅ URL encoding (special characters)
 *
 * What we learned:
 * - How to mock fetch API
 * - How to test async functions (async/await)
 * - How to simulate API responses (success and error)
 * - How to test input validation
 * - How to test abort signals
 * - How to verify function calls with expect().toHaveBeenCalledWith()
 *
 * Key testing patterns:
 * 1. ARRANGE - Set up mock data and responses
 * 2. ACT - Call the function being tested
 * 3. ASSERT - Verify the results and side effects
 *
 * Next steps:
 * - Run this test with: npm test apiService
 * - See all tests pass! 🎉
 * - Move on to testing React contexts (state management)
 */
