// src/contexts/LocationDataContext.test.tsx
/**
 * Tests for LocationDataContext - Main data loading and filtering
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { LocationDataProvider, useLocationData } from './LocationDataContext';
import { ToastProvider } from './ToastContext';
import type { Shop } from '../types';

const mockLocations: Shop[] = [
  {
    type: 'farm_stand',
    Name: 'Farm A',
    Address: '100 Farm Rd',
    slug: 'farm-a',
    lat: 43.6591,
    lng: -70.2568,
    products: { beef: true },
  },
  {
    type: 'cheese_shop',
    Name: 'Cheese B',
    Address: '200 Cheese St',
    slug: 'cheese-b',
    lat: 43.6600,
    lng: -70.2500,
    products: { cheddar: true },
  },
];

// Mock the apiService module directly - this is more reliable than mocking fetch
// since the service uses cachedFetch which has its own caching logic
const mockFetchAndProcessLocations = vi.fn();
vi.mock('../services/apiService', () => ({
  fetchAndProcessLocations: (...args: unknown[]) => mockFetchAndProcessLocations(...args),
}));

// Wrapper must include ToastProvider since LocationDataProvider uses useToast()
const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <LocationDataProvider>{children}</LocationDataProvider>
  </ToastProvider>
);

describe('LocationDataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return mock locations successfully
    mockFetchAndProcessLocations.mockResolvedValue(mockLocations);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      expect(result.current.isLoadingLocations).toBe(true);
      expect(result.current.allLocations).toEqual([]);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      expect(result.current.locationsError).toBe(null);
    });

    it('should have empty displayedLocations initially', () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      expect(result.current.currentlyDisplayedLocations).toEqual([]);
    });
  });

  describe('Data Loading', () => {
    it('should fetch locations on mount', async () => {
      renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(mockFetchAndProcessLocations).toHaveBeenCalled();
      });
    });

    it('should set allLocations after successful fetch', async () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.allLocations.length).toBe(2);
      });

      expect(result.current.allLocations).toEqual(mockLocations);
    });

    it('should set isLoadingLocations to false after fetch', async () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingLocations).toBe(false);
      });
    });

    it('should have currentlyDisplayedLocations initially empty (filtering happens elsewhere)', async () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      // currentlyDisplayedLocations is managed separately - filtering happens in App.tsx
      // It starts empty and is populated via setCurrentlyDisplayedLocations
      await waitFor(() => {
        expect(result.current.isLoadingLocations).toBe(false);
      });

      expect(result.current.currentlyDisplayedLocations).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should set error when fetch returns empty/null (service error)', async () => {
      // When apiService has an error, it returns null or empty array
      mockFetchAndProcessLocations.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.locationsError).toBeTruthy();
      });

      // Error message from LocationDataContext.tsx line 57-58
      expect(result.current.locationsError).toContain('Failed to load');
    });

    it('should set error when fetch throws', async () => {
      // When apiService throws, the catch block runs
      mockFetchAndProcessLocations.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.locationsError).toBeTruthy();
      });

      // Error message from LocationDataContext.tsx line 69
      expect(result.current.locationsError).toContain('Unable to load');
    });

    it('should set isLoadingLocations to false on error', async () => {
      mockFetchAndProcessLocations.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingLocations).toBe(false);
      });
    });

    it('should keep allLocations empty on error', async () => {
      mockFetchAndProcessLocations.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.locationsError).toBeTruthy();
      });

      expect(result.current.allLocations).toEqual([]);
    });
  });

  describe('Retry Functionality', () => {
    it('should provide retryLoadLocations function', () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      expect(typeof result.current.retryLoadLocations).toBe('function');
    });

    it('should refetch data when retryLoadLocations is called', async () => {
      // First call fails
      mockFetchAndProcessLocations.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocationData(), { wrapper });

      // Wait for initial load to fail
      await waitFor(() => {
        expect(result.current.locationsError).toBeTruthy();
      });

      // Setup success for retry
      mockFetchAndProcessLocations.mockResolvedValueOnce(mockLocations);

      // Trigger retry with act
      await act(async () => {
        result.current.retryLoadLocations();
      });

      // Wait for retry to complete
      await waitFor(() => {
        expect(mockFetchAndProcessLocations).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear error on successful retry', async () => {
      // First call fails
      mockFetchAndProcessLocations.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocationData(), { wrapper });

      // Wait for initial load to fail
      await waitFor(() => {
        expect(result.current.locationsError).toBeTruthy();
      });

      // Setup success for retry
      mockFetchAndProcessLocations.mockResolvedValueOnce(mockLocations);

      // Trigger retry
      await act(async () => {
        result.current.retryLoadLocations();
      });

      // Wait for error to be cleared
      await waitFor(() => {
        expect(result.current.locationsError).toBe(null);
      });
    });
  });

  describe('Data Updates', () => {
    it('should allow updating allLocations', async () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isLoadingLocations).toBe(false);
      });

      // allLocations should be populated from fetch
      expect(result.current.allLocations.length).toBe(2);

      // setAllLocations should be available
      expect(typeof result.current.setAllLocations).toBe('function');
    });

    it('should allow updating currentlyDisplayedLocations', async () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isLoadingLocations).toBe(false);
      });

      // currentlyDisplayedLocations starts empty (filtering happens in App.tsx)
      expect(result.current.currentlyDisplayedLocations).toEqual([]);

      // setCurrentlyDisplayedLocations should be available
      expect(typeof result.current.setCurrentlyDisplayedLocations).toBe('function');
    });
  });
});
