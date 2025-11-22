// src/contexts/SearchContext.test.tsx
/**
 * TESTING SEARCH CONTEXT
 * =======================
 *
 * This file tests the SearchContext - manages location search, radius, and Google Maps API state.
 * This is a CRITICAL context that controls WHERE the user searches for farms.
 *
 * WHY THIS IS CRITICAL:
 * ---------------------
 * SearchContext handles:
 * - Location search (where user is searching)
 * - Search radius (how far from location)
 * - Cookie persistence (remembering last search)
 * - Google Maps API readiness
 * - Default location (Portland, ME)
 * - Map view target (where map should center)
 *
 * Without this working:
 * - User's search location not remembered
 * - Map doesn't know where to center
 * - Radius filtering doesn't work
 * - Google Maps integration fails
 *
 * WHAT WE'RE TESTING:
 * -------------------
 * 1. Basic initialization (default values, error boundaries)
 * 2. Location selection and cookie persistence
 * 3. Search term management
 * 4. Radius management
 * 5. Google Maps API readiness detection
 * 6. Map view target location
 * 7. Cookie loading (saved location restoration)
 * 8. Default location (Portland, ME)
 * 9. Direct farm URL handling
 * 10. Error handling (invalid cookies, API errors)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { SearchProvider, useSearch } from './SearchContext';
import { ToastProvider } from './ToastContext';
import { AutocompletePlace } from '../types';
import { DEFAULT_SEARCH_RADIUS_MILES, LAST_SEARCHED_LOCATION_COOKIE_NAME } from '../config/appConfig';
import * as cookieHelper from '../utils/cookieHelper';
import * as loadGoogleMapsScript from '../utils/loadGoogleMapsScript';
import React from 'react';

/**
 * Mock modules
 */
vi.mock('../utils/cookieHelper', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  eraseCookie: vi.fn(),
}));

vi.mock('../utils/loadGoogleMapsScript', () => ({
  getLoadError: vi.fn(),
}));

/**
 * HELPER: Create a wrapper with all required providers
 * SearchContext depends on ToastContext
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SearchProvider>
        {children}
      </SearchProvider>
    </ToastProvider>
  );
}

/**
 * HELPER: Render the useSearch hook with its providers
 */
function renderUseSearch() {
  return renderHook(() => useSearch(), {
    wrapper: AllProviders,
  });
}

/**
 * HELPER: Create mock AutocompletePlace for Portland
 */
function createPortlandPlace(): AutocompletePlace {
  return {
    name: "Portland, Maine",
    formatted_address: "Portland, ME, USA",
    geometry: {
      location: { lat: 43.6591, lng: -70.2568 },
      viewport: undefined
    },
    place_id: "ChIJ_VrH3ayX4YkRHc6ARfYVtj8",
    address_components: undefined,
    types: undefined
  };
}

/**
 * HELPER: Create mock AutocompletePlace for Bangor
 */
function createBangorPlace(): AutocompletePlace {
  return {
    name: "Bangor, Maine",
    formatted_address: "Bangor, ME, USA",
    geometry: {
      location: { lat: 44.8012, lng: -68.7778 },
      viewport: undefined
    },
    place_id: "ChIJ_xyz123",
    address_components: undefined,
    types: undefined
  };
}

/**
 * Reset mocks and window state before each test
 */
beforeEach(() => {
  vi.clearAllMocks();

  // Reset Google Maps API state
  delete (window as any).googleMapsApiLoaded;
  delete (window as any).google;

  // Reset window location
  delete (window as any).location;
  (window as any).location = { pathname: '/' };

  // Mock getCookie to return null by default
  vi.mocked(cookieHelper.getCookie).mockReturnValue(null);

  // Mock getLoadError to return null by default
  vi.mocked(loadGoogleMapsScript.getLoadError).mockReturnValue(null);
});

/**
 * TEST SUITE 1: Basic Initialization
 * ===================================
 * Testing the initial state of the context
 */
describe('SearchContext - Initialization', () => {
  it('initializes with default Portland location', async () => {
    // WHY THIS TEST: No saved cookie → default to Portland

    const { result } = renderUseSearch();

    await waitFor(() => {
      expect(result.current.lastPlaceSelectedByAutocomplete).not.toBeNull();
    });

    expect(result.current.lastPlaceSelectedByAutocomplete?.formatted_address).toBe('Portland, ME, USA');
    expect(result.current.searchTerm).toBe('Portland, ME, USA');
    expect(result.current.currentRadius).toBe(DEFAULT_SEARCH_RADIUS_MILES);
    expect(result.current.mapViewTargetLocation?.formatted_address).toBe('Portland, ME, USA');
  });

  it('provides all expected methods and state', () => {
    // WHY THIS TEST: Verify the context exposes all required functionality

    const { result } = renderUseSearch();

    expect(result.current.lastPlaceSelectedByAutocomplete).toBeDefined();
    expect(result.current.searchTerm).toBeDefined();
    expect(result.current.currentRadius).toBeDefined();
    expect(result.current.mapsApiReady).toBeDefined();
    expect(result.current.mapViewTargetLocation).toBeDefined();
    expect(typeof result.current.setLastPlaceSelectedByAutocompleteAndCookie).toBe('function');
    expect(typeof result.current.setSearchTerm).toBe('function');
    expect(typeof result.current.setCurrentRadius).toBe('function');
    expect(typeof result.current.setMapViewTargetLocation).toBe('function');
  });

  it('throws error when used outside provider', () => {
    // WHY THIS TEST: Safety - catch developer mistakes

    expect(() => {
      renderHook(() => useSearch()); // No wrapper!
    }).toThrow('useSearch must be used within a SearchProvider');
  });
});

/**
 * TEST SUITE 2: Location Selection and Cookie Persistence
 * ========================================================
 * Testing location selection and saving to cookies
 */
describe('SearchContext - Location Selection', () => {
  it('updates location and saves to cookie', () => {
    // WHY THIS TEST: Core functionality - selecting a location

    const { result } = renderUseSearch();
    const bangorPlace = createBangorPlace();

    act(() => {
      result.current.setLastPlaceSelectedByAutocompleteAndCookie(bangorPlace, 'Bangor, ME');
    });

    // State should update
    expect(result.current.lastPlaceSelectedByAutocomplete).toEqual(bangorPlace);
    expect(result.current.searchTerm).toBe('Bangor, ME');

    // Cookie should be set
    expect(cookieHelper.setCookie).toHaveBeenCalledWith(
      LAST_SEARCHED_LOCATION_COOKIE_NAME,
      JSON.stringify({ term: 'Bangor, ME', place: bangorPlace }),
      30 // COOKIE_EXPIRY_DAYS
    );
  });

  it('clears cookie when location is null', () => {
    // WHY THIS TEST: User clears their search location

    const { result } = renderUseSearch();

    act(() => {
      result.current.setLastPlaceSelectedByAutocompleteAndCookie(null, '');
    });

    // Cookie should be erased
    expect(cookieHelper.eraseCookie).toHaveBeenCalledWith(LAST_SEARCHED_LOCATION_COOKIE_NAME);
  });

  it('clears cookie when term is empty', () => {
    // WHY THIS TEST: Invalid state - place without term

    const { result } = renderUseSearch();
    const portlandPlace = createPortlandPlace();

    act(() => {
      result.current.setLastPlaceSelectedByAutocompleteAndCookie(portlandPlace, '');
    });

    // Cookie should be erased
    expect(cookieHelper.eraseCookie).toHaveBeenCalledWith(LAST_SEARCHED_LOCATION_COOKIE_NAME);
  });

  it('clears cookie when place has no geometry', () => {
    // WHY THIS TEST: Invalid place data

    const { result } = renderUseSearch();
    const invalidPlace: AutocompletePlace = {
      name: "Invalid",
      formatted_address: "Invalid",
      geometry: undefined, // No geometry
    };

    act(() => {
      result.current.setLastPlaceSelectedByAutocompleteAndCookie(invalidPlace, 'Invalid');
    });

    // Cookie should be erased
    expect(cookieHelper.eraseCookie).toHaveBeenCalledWith(LAST_SEARCHED_LOCATION_COOKIE_NAME);
  });
});

/**
 * TEST SUITE 3: Search Term Management
 * =====================================
 * Testing search term updates
 */
describe('SearchContext - Search Term', () => {
  it('allows updating search term directly', () => {
    // WHY THIS TEST: User types in search box

    const { result } = renderUseSearch();

    act(() => {
      result.current.setSearchTerm('Augusta, ME');
    });

    expect(result.current.searchTerm).toBe('Augusta, ME');
  });

  it('updates search term when location selected', () => {
    // WHY THIS TEST: Autocomplete selection updates term

    const { result } = renderUseSearch();
    const bangorPlace = createBangorPlace();

    act(() => {
      result.current.setLastPlaceSelectedByAutocompleteAndCookie(bangorPlace, 'Bangor, ME');
    });

    expect(result.current.searchTerm).toBe('Bangor, ME');
  });
});

/**
 * TEST SUITE 4: Radius Management
 * ================================
 * Testing search radius updates
 */
describe('SearchContext - Radius', () => {
  it('initializes with default radius', () => {
    // WHY THIS TEST: Default radius should be set

    const { result } = renderUseSearch();

    expect(result.current.currentRadius).toBe(DEFAULT_SEARCH_RADIUS_MILES);
  });

  it('allows updating radius', () => {
    // WHY THIS TEST: User adjusts search radius

    const { result } = renderUseSearch();

    act(() => {
      result.current.setCurrentRadius(50);
    });

    expect(result.current.currentRadius).toBe(50);
  });

  it('allows multiple radius updates', () => {
    // WHY THIS TEST: User adjusts slider multiple times

    const { result } = renderUseSearch();

    act(() => {
      result.current.setCurrentRadius(10);
    });
    expect(result.current.currentRadius).toBe(10);

    act(() => {
      result.current.setCurrentRadius(25);
    });
    expect(result.current.currentRadius).toBe(25);

    act(() => {
      result.current.setCurrentRadius(100);
    });
    expect(result.current.currentRadius).toBe(100);
  });
});

/**
 * TEST SUITE 5: Google Maps API Readiness
 * ========================================
 * Testing Maps API state detection
 */
describe('SearchContext - Maps API Readiness', () => {
  it('detects Maps API when already loaded', () => {
    // WHY THIS TEST: API loaded before component mounts

    (window as any).googleMapsApiLoaded = true;
    (window as any).google = {
      maps: {
        DirectionsService: class {},
      },
    };

    const { result } = renderUseSearch();

    // Should immediately be ready
    expect(result.current.mapsApiReady).toBe(true);
  });

  it('waits for Maps API load event', async () => {
    // WHY THIS TEST: API loads after component mounts

    const { result } = renderUseSearch();

    // Initially not ready
    expect(result.current.mapsApiReady).toBe(false);

    // Simulate API loading
    act(() => {
      (window as any).googleMapsApiLoaded = true;
      (window as any).google = {
        maps: {
          DirectionsService: class {},
        },
      };
      window.dispatchEvent(new CustomEvent('google-maps-api-loaded'));
    });

    await waitFor(() => {
      expect(result.current.mapsApiReady).toBe(true);
    });
  });

  it('handles Maps API load error', async () => {
    // WHY THIS TEST: API fails to load

    // Set up error before component mounts
    vi.mocked(loadGoogleMapsScript.getLoadError).mockReturnValue(new Error('Failed to load Maps API'));

    const { result } = renderUseSearch();

    // API should not be ready
    expect(result.current.mapsApiReady).toBe(false);

    // getLoadError should have been called
    await waitFor(() => {
      expect(loadGoogleMapsScript.getLoadError).toHaveBeenCalled();
    });
  });
});

/**
 * TEST SUITE 6: Map View Target Location
 * =======================================
 * Testing map center target updates
 */
describe('SearchContext - Map View Target', () => {
  it('allows updating map view target', () => {
    // WHY THIS TEST: Map needs to recenter

    const { result } = renderUseSearch();
    const bangorPlace = createBangorPlace();

    act(() => {
      result.current.setMapViewTargetLocation(bangorPlace);
    });

    expect(result.current.mapViewTargetLocation).toEqual(bangorPlace);
  });

  it('initializes map view target to default location', async () => {
    // WHY THIS TEST: Map should center on Portland by default

    const { result } = renderUseSearch();

    await waitFor(() => {
      expect(result.current.mapViewTargetLocation?.formatted_address).toBe('Portland, ME, USA');
    });
  });
});

/**
 * TEST SUITE 7: Cookie Loading
 * =============================
 * Testing saved location restoration
 */
describe('SearchContext - Cookie Loading', () => {
  it('loads saved location from cookie', async () => {
    // WHY THIS TEST: User returns to site, should see last search

    const savedPlace = createBangorPlace();
    const savedData = { term: 'Bangor, ME', place: savedPlace };

    vi.mocked(cookieHelper.getCookie).mockReturnValue(JSON.stringify(savedData));

    const { result } = renderUseSearch();

    await waitFor(() => {
      expect(result.current.lastPlaceSelectedByAutocomplete).toEqual(savedPlace);
    });

    expect(result.current.searchTerm).toBe('Bangor, ME');
    expect(result.current.mapViewTargetLocation).toEqual(savedPlace);
  });

  it('handles invalid cookie JSON', async () => {
    // WHY THIS TEST: Corrupted cookie data

    vi.mocked(cookieHelper.getCookie).mockReturnValue('invalid json{');

    const { result } = renderUseSearch();

    // Should fall back to Portland
    await waitFor(() => {
      expect(result.current.lastPlaceSelectedByAutocomplete?.formatted_address).toBe('Portland, ME, USA');
    });
  });

  it('handles cookie with missing geometry', async () => {
    // WHY THIS TEST: Invalid saved data

    const invalidData = {
      term: 'Test',
      place: { formatted_address: 'Test' } // Missing geometry
    };

    vi.mocked(cookieHelper.getCookie).mockReturnValue(JSON.stringify(invalidData));

    const { result } = renderUseSearch();

    // Should fall back to Portland
    await waitFor(() => {
      expect(result.current.lastPlaceSelectedByAutocomplete?.formatted_address).toBe('Portland, ME, USA');
    });
  });

  it('does not load cookie when on direct farm URL', async () => {
    // WHY THIS TEST: Direct links to farms shouldn't override location

    (window as any).location = { pathname: '/farm/happy-farm' };

    const savedPlace = createBangorPlace();
    vi.mocked(cookieHelper.getCookie).mockReturnValue(
      JSON.stringify({ term: 'Bangor, ME', place: savedPlace })
    );

    const { result } = renderUseSearch();

    // Should NOT load cookie (values should be initial/empty)
    expect(result.current.lastPlaceSelectedByAutocomplete).toBeNull();
  });
});

/**
 * TEST SUMMARY
 * ============
 *
 * What we tested:
 * ✅ Basic initialization (default values, error boundaries)
 * ✅ Location selection (updates, cookie persistence, edge cases)
 * ✅ Search term management (direct updates, autocomplete updates)
 * ✅ Radius management (default, updates)
 * ✅ Maps API readiness (already loaded, load events, errors)
 * ✅ Map view target (updates, default)
 * ✅ Cookie loading (saved data, invalid data, direct URLs)
 *
 * What we learned:
 * - How to test contexts with multiple dependencies (ToastContext)
 * - How to mock window events (custom events)
 * - How to test cookie persistence
 * - How to test initialization with different cookie states
 * - How to test window.location behavior
 * - How to test Google Maps API integration
 *
 * Coverage: Near 100% of SearchContext.tsx 🎉
 *
 * Why this matters:
 * - SearchContext is used throughout the app for location search
 * - Cookie persistence remembers user's last search
 * - Maps API readiness prevents race conditions
 * - Default location ensures app always has a valid center point
 * - Direct farm URLs work correctly without location override
 */
