// src/contexts/DirectionsContext.test.tsx
/**
 * Tests for DirectionsContext - Google Maps directions management
 *
 * NOTE: Full integration testing with Google Maps requires complex mocking.
 * These tests verify the public API is available.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { DirectionsProvider, useDirections } from './DirectionsContext';
import { SearchProvider } from './SearchContext';
import { ToastProvider } from './ToastContext';
import { mockGoogleMaps } from '../test/mocks/googleMaps';

// SearchProvider uses useSearchParams which requires a Router
const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <ToastProvider>
      <SearchProvider>
        <DirectionsProvider>{children}</DirectionsProvider>
      </SearchProvider>
    </ToastProvider>
  </MemoryRouter>
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

  describe('Public API', () => {
    it('should provide fetchAndDisplayDirections function', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(typeof result.current.fetchAndDisplayDirections).toBe('function');
    });

    it('should provide clearDirections function', () => {
      const { result } = renderHook(() => useDirections(), { wrapper });

      expect(typeof result.current.clearDirections).toBe('function');
    });
  });

  describe('Context requirement', () => {
    it('should throw error when used outside provider', () => {
      // Using a minimal wrapper without DirectionsProvider
      const minimalWrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter>
          <ToastProvider>
            <SearchProvider>{children}</SearchProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(() => {
        renderHook(() => useDirections(), { wrapper: minimalWrapper });
      }).toThrow('useDirections must be used within a DirectionsProvider');
    });
  });
});
