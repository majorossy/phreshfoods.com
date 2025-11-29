// src/contexts/LocationDataContext.test.tsx
/**
 * Tests for LocationDataContext - Main data loading and filtering
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { LocationDataProvider, useLocationData } from './LocationDataContext';
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

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const wrapper = ({ children }: { children: ReactNode }) => (
  <LocationDataProvider>{children}</LocationDataProvider>
);

describe('LocationDataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLocations),
    });
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
        expect(mockFetch).toHaveBeenCalledWith('/api/locations');
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

    it('should set currentlyDisplayedLocations to all locations initially', async () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentlyDisplayedLocations.length).toBe(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should set error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.locationsError).toBeTruthy();
      });

      expect(result.current.locationsError).toContain('Failed to load');
    });

    it('should set isLoadingLocations to false on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoadingLocations).toBe(false);
      });
    });

    it('should keep allLocations empty on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

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
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.locationsError).toBeTruthy();
      });

      // Clear the error mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLocations),
      });

      // Retry
      await waitFor(() => {
        result.current.retryLoadLocations();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear error on successful retry', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.locationsError).toBeTruthy();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLocations),
      });

      await waitFor(() => {
        result.current.retryLoadLocations();
      });

      await waitFor(() => {
        expect(result.current.locationsError).toBe(null);
      });
    });
  });

  describe('Data Updates', () => {
    it('should allow updating allLocations', async () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.allLocations.length).toBe(2);
      });

      const newLocations: Shop[] = [
        {
          type: 'butcher',
          Name: 'Butcher C',
          Address: '300 Meat Ave',
          slug: 'butcher-c',
          lat: 43.6610,
          lng: -70.2600,
          products: { beef: true },
        },
      ];

      // setAllLocations should be available
      expect(typeof result.current.setAllLocations).toBe('function');
    });

    it('should allow updating currentlyDisplayedLocations', async () => {
      const { result } = renderHook(() => useLocationData(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentlyDisplayedLocations.length).toBe(2);
      });

      // setCurrentlyDisplayedLocations should be available
      expect(typeof result.current.setCurrentlyDisplayedLocations).toBe('function');
    });
  });
});
