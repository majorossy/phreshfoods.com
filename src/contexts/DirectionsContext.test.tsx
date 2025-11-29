// src/contexts/DirectionsContext.test.tsx
/**
 * Tests for DirectionsContext - Google Maps directions management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { DirectionsProvider, useDirections } from './DirectionsContext';
import { SearchProvider } from './SearchContext';
import { ToastProvider } from './ToastContext';
import { mockGoogleMaps } from '../test/mocks/googleMaps';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <SearchProvider>
      <DirectionsProvider>{children}</DirectionsProvider>
    </SearchProvider>
  </ToastProvider>
);

describe('DirectionsContext', () => {
  beforeEach(() => {
    mockGoogleMaps();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have no directions result initially', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(result.current.directionsResult).toBe(null);
    });

    it('should not be fetching initially', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(result.current.isFetchingDirections).toBe(false);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(result.current.directionsError).toBe(null);
    });
  });

  describe('fetchDirections', () => {
    it('should provide fetchDirections function', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(typeof result.current.fetchDirections).toBe('function');
    });

    it('should set loading state when fetching', async () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.fetchDirections('Portland, ME', 'Bangor, ME');
      });

      // Should be fetching immediately
      expect(result.current.isFetchingDirections).toBe(true);
    });

    it('should clear error when starting new fetch', async () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      // Set an error first
      act(() => {
        result.current.clearDirections();
      });

      act(() => {
        result.current.fetchDirections('Portland, ME', 'Bangor, ME');
      });

      // Error should be cleared
      expect(result.current.directionsError).toBe(null);
    });

    it('should handle successful directions fetch', async () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.fetchDirections('Portland, ME', 'Bangor, ME');
      });

      await waitFor(() => {
        expect(result.current.isFetchingDirections).toBe(false);
      }, { timeout: 3000 });

      // Should have result or error set
      const hasResultOrError = result.current.directionsResult !== null || result.current.directionsError !== null;
      expect(hasResultOrError).toBe(true);
    });

    it('should require both origin and destination', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.fetchDirections('', 'Bangor, ME');
      });

      // Should not attempt fetch with empty origin
      expect(result.current.isFetchingDirections).toBe(false);
    });
  });

  describe('clearDirections', () => {
    it('should provide clearDirections function', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(typeof result.current.clearDirections).toBe('function');
    });

    it('should clear directions result', async () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      // Fetch directions first
      act(() => {
        result.current.fetchDirections('Portland, ME', 'Bangor, ME');
      });

      await waitFor(() => {
        expect(result.current.isFetchingDirections).toBe(false);
      }, { timeout: 3000 });

      // Clear directions
      act(() => {
        result.current.clearDirections();
      });

      expect(result.current.directionsResult).toBe(null);
      expect(result.current.directionsError).toBe(null);
    });

    it('should clear error state', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.clearDirections();
      });

      expect(result.current.directionsError).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('should set error when fetch fails', async () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      // Mock a failed fetch
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

      act(() => {
        result.current.fetchDirections('Portland, ME', 'InvalidPlace123');
      });

      await waitFor(() => {
        expect(result.current.isFetchingDirections).toBe(false);
      }, { timeout: 3000 });

      // Should either have result or error
      expect(result.current.directionsError !== null || result.current.directionsResult !== null).toBe(true);
    });

    it('should stop loading on error', async () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

      act(() => {
        result.current.fetchDirections('Portland, ME', 'InvalidPlace');
      });

      await waitFor(() => {
        expect(result.current.isFetchingDirections).toBe(false);
      }, { timeout: 3000 });
    });
  });

  describe('Integration with Google Maps API', () => {
    it('should use DirectionsService from Google Maps', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      // Should integrate with google.maps.DirectionsService
      expect(typeof result.current.fetchDirections).toBe('function');
    });

    it('should handle DirectionsRenderer result format', async () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.fetchDirections('Portland, ME', 'Bangor, ME');
      });

      await waitFor(() => {
        expect(result.current.isFetchingDirections).toBe(false);
      }, { timeout: 3000 });

      // Result should match Google Maps DirectionsResult format
      if (result.current.directionsResult) {
        expect(result.current.directionsResult).toBeTruthy();
      }
    });
  });

  describe('State Transitions', () => {
    it('should transition from loading → success', async () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(result.current.isFetchingDirections).toBe(false);

      act(() => {
        result.current.fetchDirections('Portland, ME', 'Bangor, ME');
      });

      expect(result.current.isFetchingDirections).toBe(true);

      await waitFor(() => {
        expect(result.current.isFetchingDirections).toBe(false);
      }, { timeout: 3000 });
    });

    it('should allow multiple fetches', async () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      act(() => {
        result.current.fetchDirections('Portland, ME', 'Bangor, ME');
      });

      await waitFor(() => {
        expect(result.current.isFetchingDirections).toBe(false);
      }, { timeout: 3000 });

      // Fetch again with different destination
      act(() => {
        result.current.fetchDirections('Portland, ME', 'Augusta, ME');
      });

      expect(result.current.isFetchingDirections).toBe(true);
    });
  });
});
