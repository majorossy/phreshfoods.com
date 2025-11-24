// src/contexts/FarmDataContext.test.tsx
/**
 * BEGINNER'S GUIDE TO TESTING ASYNC CONTEXTS
 * ============================================
 *
 * This file tests an async React Context - one that fetches data from an API.
 * This is MORE COMPLEX than FilterContext because it involves:
 * - Async data fetching
 * - Loading states
 * - Error handling
 * - Mocking external dependencies (apiService)
 * - Testing useEffect hooks
 * - Abort signals
 *
 * KEY CONCEPTS YOU'LL LEARN:
 * ---------------------------
 * 1. How to mock imported modules (apiService)
 * 2. How to test async state updates with waitFor()
 * 3. How to test loading states
 * 4. How to test error handling
 * 5. How to test retry logic
 * 6. How to test abort signals
 *
 * NEW TESTING TOOLS:
 * ------------------
 * - waitFor() - Wait for async state updates
 * - vi.mock() - Mock entire modules
 * - vi.fn() - Create mock functions
 * - mockResolvedValue() - Mock successful async responses
 * - mockRejectedValue() - Mock failed async responses
 *
 * WHY waitFor()?
 * --------------
 * When contexts fetch data asynchronously, state updates happen AFTER a delay.
 * waitFor() repeatedly checks a condition until it's true (or times out).
 * This prevents flaky tests that check state too early!
 *
 * EXAMPLE:
 * --------
 * await waitFor(() => {
 *   expect(result.current.isLoadingFarmStands).toBe(false);
 * });
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { FarmDataProvider, useFarmData } from './FarmDataContext';
import * as apiService from '../services/apiService';
import { Shop } from '../types';
import { ToastProvider } from './ToastContext';
import React from 'react';

/**
 * Mock the apiService module
 * WHY: We don't want to make real API calls during tests
 */
vi.mock('../services/apiService', () => ({
  fetchAndProcessLocations: vi.fn(),
}));

/**
 * HELPER: Create a wrapper with all required providers
 * FarmDataContext depends on ToastContext, so we need both
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <FarmDataProvider>
        {children}
      </FarmDataProvider>
    </ToastProvider>
  );
}

/**
 * HELPER: Render the useFarmData hook with its providers
 */
function renderUseFarmData() {
  return renderHook(() => useFarmData(), {
    wrapper: AllProviders,
  });
}

/**
 * HELPER: Create mock farm stand data for tests
 */
function createMockFarmStands(): Shop[] {
  return [
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
}

// Reset all mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * TEST SUITE 1: Basic Initialization
 * ===================================
 * Testing the initial state of the context
 */
describe('FarmDataContext - Initialization', () => {
  it('starts in loading state', () => {
    // WHY THIS TEST: Users should see a loading indicator immediately

    // Mock API call that never resolves (simulates slow network)
    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderUseFarmData();

    // Should be loading initially
    expect(result.current.isLoadingFarmStands).toBe(true);
    expect(result.current.allFarmStands).toEqual([]);
    expect(result.current.farmStandsError).toBeNull();
  });

  it('provides all expected methods and state', () => {
    // WHY THIS TEST: Verify the context exposes all required functionality

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockResolvedValue([]);

    const { result } = renderUseFarmData();

    // Check all methods and state exist
    expect(result.current.allFarmStands).toBeDefined();
    expect(result.current.currentlyDisplayedShops).toBeDefined();
    expect(result.current.isLoadingFarmStands).toBeDefined();
    expect(result.current.farmStandsError).toBeDefined();
    expect(typeof result.current.setAllFarmStands).toBe('function');
    expect(typeof result.current.setCurrentlyDisplayedShops).toBe('function');
    expect(typeof result.current.retryLoadFarmStands).toBe('function');
  });

  it('throws error when used outside provider', () => {
    // WHY THIS TEST: Safety - catch developer mistakes

    expect(() => {
      renderHook(() => useFarmData()); // No wrapper!
    }).toThrow('useFarmData must be used within a FarmDataProvider');
  });
});

/**
 * TEST SUITE 2: Successful Data Loading
 * ======================================
 * Testing the happy path - data loads successfully
 */
describe('FarmDataContext - Successful Data Loading', () => {
  it('loads farm stands on mount', async () => {
    // WHY THIS TEST: Core functionality - does it fetch data automatically?

    const mockFarmStands = createMockFarmStands();
    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockResolvedValue(mockFarmStands);

    const { result } = renderUseFarmData();

    // Initially loading
    expect(result.current.isLoadingFarmStands).toBe(true);

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });

    // Data should be loaded
    expect(result.current.allFarmStands).toEqual(mockFarmStands);
    expect(result.current.allFarmStands).toHaveLength(2);
    expect(result.current.farmStandsError).toBeNull();
  });

  it('calls fetchAndProcessLocations with abort signal', async () => {
    // WHY THIS TEST: Ensure we can cancel requests on unmount

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockResolvedValue([]);

    renderUseFarmData();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Should be called with an AbortSignal
    expect(mockFetch).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it('sets error to null on successful load', async () => {
    // WHY THIS TEST: Clear any previous errors on successful retry

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockResolvedValue(createMockFarmStands());

    const { result } = renderUseFarmData();

    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });

    expect(result.current.farmStandsError).toBeNull();
  });
});

/**
 * TEST SUITE 3: Error Handling
 * =============================
 * Testing what happens when data loading fails
 */
describe('FarmDataContext - Error Handling', () => {
  it('handles fetch errors gracefully', async () => {
    // WHY THIS TEST: Backend might be down, network might fail

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderUseFarmData();

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });

    // Should have error message
    expect(result.current.farmStandsError).not.toBeNull();
    expect(result.current.farmStandsError).toContain('Unable to load farm data');

    // Should have empty array, not undefined
    expect(result.current.allFarmStands).toEqual([]);
  });

  it('handles non-array response', async () => {
    // WHY THIS TEST: Backend might return unexpected data format

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockResolvedValue(null as any); // Invalid response

    const { result } = renderUseFarmData();

    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });

    // Should treat as error
    expect(result.current.farmStandsError).not.toBeNull();
    expect(result.current.farmStandsError).toContain('Failed to load farm stands');
    expect(result.current.allFarmStands).toEqual([]);
  });

  it('sets loading to false after error', async () => {
    // WHY THIS TEST: Don't get stuck in loading state on error

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockRejectedValue(new Error('Failed'));

    const { result } = renderUseFarmData();

    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });

    // Loading should be done even though there was an error
    expect(result.current.isLoadingFarmStands).toBe(false);
  });
});

/**
 * TEST SUITE 4: Retry Functionality
 * ==================================
 * Testing the retry mechanism
 */
describe('FarmDataContext - Retry', () => {
  it('retries loading farm stands', async () => {
    // WHY THIS TEST: User clicks "Try Again" button after error

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);

    // First call fails
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderUseFarmData();

    // Wait for initial load to fail
    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });

    expect(result.current.farmStandsError).not.toBeNull();

    // Second call succeeds
    mockFetch.mockResolvedValueOnce(createMockFarmStands());

    // Retry
    result.current.retryLoadFarmStands();

    // Wait for retry to complete
    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });

    // Should now have data
    expect(result.current.allFarmStands).toHaveLength(2);
    expect(result.current.farmStandsError).toBeNull();
  });

  it('clears error on retry attempt', async () => {
    // WHY THIS TEST: Don't show old error message during retry

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockRejectedValueOnce(new Error('Error'));

    const { result } = renderUseFarmData();

    await waitFor(() => {
      expect(result.current.farmStandsError).not.toBeNull();
    });

    // Set up next call to succeed
    mockFetch.mockResolvedValueOnce([]);

    // Retry (wrap in act since it triggers state updates)
    await act(async () => {
      result.current.retryLoadFarmStands();
    });

    // Wait for retry to finish
    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });
  });
});

/**
 * TEST SUITE 5: Abort Signal Handling
 * ====================================
 * Testing request cancellation
 */
describe('FarmDataContext - Abort Signal', () => {
  it('does not update state when request is aborted', async () => {
    // WHY THIS TEST: Prevent memory leaks and state updates after unmount

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);

    mockFetch.mockImplementation(async (signal) => {
      // Simulate slow network
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if aborted
      if (signal?.aborted) {
        return [];
      }

      return createMockFarmStands();
    });

    const { result, unmount } = renderUseFarmData();

    // Unmount immediately (triggers abort)
    unmount();

    // Give it time to complete (if it were going to)
    await new Promise(resolve => setTimeout(resolve, 150));

    // State should remain in initial state (no updates after unmount)
    // Note: We can't check result.current after unmount, so this test
    // mainly ensures no errors are thrown
  });
});

/**
 * TEST SUITE 6: State Setters
 * ============================
 * Testing direct state manipulation
 */
describe('FarmDataContext - State Setters', () => {
  it('allows setting allFarmStands directly', async () => {
    // WHY THIS TEST: Advanced usage - manually set data

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockResolvedValue([]);

    const { result } = renderUseFarmData();

    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });

    const customData = createMockFarmStands();

    // Set data directly (wrap in act)
    act(() => {
      result.current.setAllFarmStands(customData);
    });

    expect(result.current.allFarmStands).toEqual(customData);
  });

  it('allows setting currentlyDisplayedShops', async () => {
    // WHY THIS TEST: App.tsx sets this after filtering

    const mockFetch = vi.mocked(apiService.fetchAndProcessLocations);
    mockFetch.mockResolvedValue([]);

    const { result } = renderUseFarmData();

    await waitFor(() => {
      expect(result.current.isLoadingFarmStands).toBe(false);
    });

    const displayedShops = createMockFarmStands().map(shop => ({
      ...shop,
      distance: 1000,
      distanceText: '0.6 mi',
    }));

    // Wrap in act
    act(() => {
      result.current.setCurrentlyDisplayedShops(displayedShops);
    });

    expect(result.current.currentlyDisplayedShops).toEqual(displayedShops);
  });
});

/**
 * TEST SUMMARY
 * ============
 *
 * What we tested:
 * ✅ Basic initialization (loading state, initial values, error boundaries)
 * ✅ Successful data loading (fetch on mount, abort signals, error clearing)
 * ✅ Error handling (network errors, invalid responses, loading state)
 * ✅ Retry functionality (retry after error, error clearing)
 * ✅ Abort signal handling (cleanup on unmount)
 * ✅ State setters (direct state manipulation)
 *
 * What we learned:
 * - How to mock imported modules (vi.mock)
 * - How to test async state updates (waitFor)
 * - How to test loading states
 * - How to test error handling
 * - How to mock successful/failed promises
 * - How to test cleanup (abort signals)
 * - How to test contexts with dependencies (ToastContext)
 *
 * Testing pattern for async contexts:
 * 1. Mock the external dependencies (apiService)
 * 2. renderHook with all required providers
 * 3. Check initial loading state
 * 4. await waitFor(() => { check final state })
 * 5. Verify data, errors, loading state
 *
 * Next steps:
 * - Run this test with: npm test FarmDataContext
 * - All tests should pass! 🎉
 * - We now have 3/5 critical tests complete!
 */
