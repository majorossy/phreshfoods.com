// src/contexts/TripPlannerContext.test.tsx
/**
 * Tests for TripPlannerContext - Trip planning functionality
 *
 * The TripPlannerContext manages:
 * - tripStops: TripStop[] (array of {shop, order, id})
 * - isTripMode: boolean
 * - addStopToTrip(shop): Add shop to trip
 * - removeStopFromTrip(stopId): Remove by stop ID (not slug)
 * - isShopInTrip(shopSlug): Check if shop is in trip
 * - reorderStops(fromIndex, toIndex): Reorder stops
 * - toggleTripMode(): Toggle trip mode on/off
 * - clearTrip(): Clear all stops
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { TripPlannerProvider, useTripPlanner } from './TripPlannerContext';
import { ToastProvider } from './ToastContext';
import { LocationDataProvider } from './LocationDataContext';
import type { Shop } from '../types';

// Mock the apiService to prevent actual API calls
vi.mock('../services/apiService', () => ({
  fetchAndProcessLocations: vi.fn().mockResolvedValue([]),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockShop1: Shop = {
  type: 'farm_stand',
  Name: 'Farm A',
  Address: '100 Farm Rd',
  slug: 'farm-a',
  lat: 43.6591,
  lng: -70.2568,
  products: { beef: true },
};

const mockShop2: Shop = {
  type: 'cheese_shop',
  Name: 'Cheese B',
  Address: '200 Cheese St',
  slug: 'cheese-b',
  lat: 43.6600,
  lng: -70.2500,
  products: { cheddar: true },
};

// TripPlannerProvider needs ToastProvider and LocationDataProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <LocationDataProvider>
      <TripPlannerProvider>{children}</TripPlannerProvider>
    </LocationDataProvider>
  </ToastProvider>
);

describe('TripPlannerContext', () => {
  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty trip stops initially', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      expect(result.current.tripStops).toEqual([]);
    });

    it('should not be in trip mode initially', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      // The context uses isTripMode, not isTripPlanningMode
      expect(result.current.isTripMode).toBe(false);
    });
  });

  describe('Adding Stops', () => {
    it('should add stop to trip', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      expect(result.current.tripStops.length).toBe(1);
      // tripStops contains TripStop objects with shop property
      expect(result.current.tripStops[0].shop).toEqual(mockShop1);
    });

    it('should add multiple stops', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
        result.current.addStopToTrip(mockShop2);
      });

      expect(result.current.tripStops.length).toBe(2);
    });

    it('should not add duplicate stops', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      // Try to add the same shop again (in a new act to allow state to settle)
      act(() => {
        result.current.addStopToTrip(mockShop1); // Duplicate
      });

      // Should only have one stop (no duplicates)
      expect(result.current.tripStops.length).toBe(1);
    });

    it('should maintain order of stops', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
        result.current.addStopToTrip(mockShop2);
      });

      expect(result.current.tripStops[0].shop.Name).toBe('Farm A');
      expect(result.current.tripStops[1].shop.Name).toBe('Cheese B');
    });

    it('should auto-enable trip mode when first stop is added', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      expect(result.current.isTripMode).toBe(false);

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      expect(result.current.isTripMode).toBe(true);
    });
  });

  describe('Removing Stops', () => {
    it('should remove stop from trip by stop ID', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
        result.current.addStopToTrip(mockShop2);
      });

      // Get the first stop's ID
      const stopIdToRemove = result.current.tripStops[0].id;

      act(() => {
        result.current.removeStopFromTrip(stopIdToRemove);
      });

      expect(result.current.tripStops.length).toBe(1);
      expect(result.current.tripStops[0].shop.slug).toBe('cheese-b');
    });

    it('should handle removing non-existent stop', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      act(() => {
        result.current.removeStopFromTrip('non-existent-id');
      });

      // Should not crash, original stop should remain
      expect(result.current.tripStops.length).toBe(1);
    });
  });

  describe('Checking Shop in Trip', () => {
    it('should return true when shop is in trip', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      // isShopInTrip takes a slug, not a Shop object
      expect(result.current.isShopInTrip(mockShop1.slug)).toBe(true);
    });

    it('should return false when shop is not in trip', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      expect(result.current.isShopInTrip(mockShop2.slug)).toBe(false);
    });

    it('should check by slug', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      // Should match by slug
      expect(result.current.isShopInTrip('farm-a')).toBe(true);
      expect(result.current.isShopInTrip('cheese-b')).toBe(false);
    });
  });

  describe('Clearing Trip', () => {
    it('should clear all stops', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
        result.current.addStopToTrip(mockShop2);
      });

      expect(result.current.tripStops.length).toBe(2);

      act(() => {
        result.current.clearTrip();
      });

      expect(result.current.tripStops.length).toBe(0);
    });

    it('should handle clearing empty trip', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.clearTrip();
      });

      // Should not crash
      expect(result.current.tripStops.length).toBe(0);
    });
  });

  describe('Trip Mode', () => {
    it('should toggle trip mode on', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.toggleTripMode();
      });

      expect(result.current.isTripMode).toBe(true);
    });

    it('should toggle trip mode off', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.toggleTripMode(); // Turn on
      });

      act(() => {
        result.current.toggleTripMode(); // Turn off
      });

      expect(result.current.isTripMode).toBe(false);
    });
  });

  describe('Reordering Stops', () => {
    it('should reorder stops in trip', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
        result.current.addStopToTrip(mockShop2);
      });

      // Reorder: move index 0 to index 1
      act(() => {
        result.current.reorderStops(0, 1);
      });

      expect(result.current.tripStops[0].shop.Name).toBe('Cheese B');
      expect(result.current.tripStops[1].shop.Name).toBe('Farm A');
    });

    it('should handle reordering with invalid indices', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      // This should not crash
      act(() => {
        result.current.reorderStops(0, 5);
      });

      expect(result.current.tripStops).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle shops with missing slugs gracefully', () => {
      const shopWithoutSlug = {
        ...mockShop1,
        slug: undefined,
      } as any;

      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(shopWithoutSlug);
      });

      // Should handle gracefully
      expect(result.current.tripStops.length).toBeLessThanOrEqual(1);
    });

    it('should provide trip share URL function', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      expect(typeof result.current.getTripShareUrl).toBe('function');
    });

    it('should provide route optimization toggle', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      expect(typeof result.current.toggleRouteOptimization).toBe('function');
      expect(result.current.isOptimizedRoute).toBe(false);
    });
  });
});
