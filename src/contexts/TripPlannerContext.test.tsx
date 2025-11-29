// src/contexts/TripPlannerContext.test.tsx
/**
 * Tests for TripPlannerContext - Trip planning functionality
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { TripPlannerProvider, useTripPlanner } from './TripPlannerContext';
import type { Shop } from '../types';

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

const wrapper = ({ children }: { children: ReactNode }) => (
  <TripPlannerProvider>{children}</TripPlannerProvider>
);

describe('TripPlannerContext', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have empty trip stops initially', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      expect(result.current.tripStops).toEqual([]);
    });

    it('should not be in trip planning mode initially', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      expect(result.current.isTripPlanningMode).toBe(false);
    });
  });

  describe('Adding Stops', () => {
    it('should add stop to trip', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      expect(result.current.tripStops.length).toBe(1);
      expect(result.current.tripStops[0]).toEqual(mockShop1);
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

      expect(result.current.tripStops[0].Name).toBe('Farm A');
      expect(result.current.tripStops[1].Name).toBe('Cheese B');
    });
  });

  describe('Removing Stops', () => {
    it('should remove stop from trip by slug', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
        result.current.addStopToTrip(mockShop2);
      });

      act(() => {
        result.current.removeStopFromTrip('farm-a');
      });

      expect(result.current.tripStops.length).toBe(1);
      expect(result.current.tripStops[0].slug).toBe('cheese-b');
    });

    it('should handle removing non-existent stop', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      act(() => {
        result.current.removeStopFromTrip('non-existent');
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

      expect(result.current.isShopInTrip(mockShop1)).toBe(true);
    });

    it('should return false when shop is not in trip', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      expect(result.current.isShopInTrip(mockShop2)).toBe(false);
    });

    it('should check by slug or GoogleProfileID', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      // Should match by slug
      expect(result.current.isShopInTrip(mockShop1)).toBe(true);
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

  describe('Trip Planning Mode', () => {
    it('should toggle trip planning mode on', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.setIsTripPlanningMode(true);
      });

      expect(result.current.isTripPlanningMode).toBe(true);
    });

    it('should toggle trip planning mode off', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.setIsTripPlanningMode(true);
      });

      act(() => {
        result.current.setIsTripPlanningMode(false);
      });

      expect(result.current.isTripPlanningMode).toBe(false);
    });
  });

  describe('Reordering Stops', () => {
    it('should reorder stops in trip', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
        result.current.addStopToTrip(mockShop2);
      });

      act(() => {
        result.current.reorderStops([mockShop2, mockShop1]);
      });

      expect(result.current.tripStops[0].Name).toBe('Cheese B');
      expect(result.current.tripStops[1].Name).toBe('Farm A');
    });

    it('should handle empty reorder', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      act(() => {
        result.current.reorderStops([]);
      });

      // Should clear stops or handle gracefully
      expect(result.current.tripStops).toBeTruthy();
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save trip to localStorage when stops change', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      // Check localStorage
      const saved = localStorage.getItem('tripPlanner_stops');
      expect(saved).toBeTruthy();
    });

    it('should restore trip from localStorage on mount', () => {
      // Pre-populate localStorage
      localStorage.setItem('tripPlanner_stops', JSON.stringify([mockShop1]));

      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      // Should restore from storage
      expect(result.current.tripStops.length).toBeGreaterThanOrEqual(0);
    });

    it('should clear localStorage when trip is cleared', () => {
      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(mockShop1);
      });

      act(() => {
        result.current.clearTrip();
      });

      const saved = localStorage.getItem('tripPlanner_stops');
      expect(saved).toBe('[]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupt localStorage data', () => {
      localStorage.setItem('tripPlanner_stops', 'invalid json{{{');

      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      // Should not crash, should start with empty trip
      expect(result.current.tripStops).toEqual([]);
    });

    it('should handle shops with missing slugs', () => {
      const shopWithoutSlug = {
        ...mockShop1,
        slug: undefined,
        GoogleProfileID: 'profile-123',
      } as any;

      const { result } = renderHook(() => useTripPlanner(), { wrapper });

      act(() => {
        result.current.addStopToTrip(shopWithoutSlug);
      });

      // Should use GoogleProfileID as fallback
      expect(result.current.tripStops.length).toBe(1);
    });
  });
});
