// src/tests/integration/overlayNavigation.test.tsx
/**
 * Integration tests for overlay navigation behavior
 *
 * NOTE: Full App integration tests require extensive mocking and often cause
 * flaky tests. These tests verify the navigation utilities work correctly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockGoogleMaps } from '../../test/mocks/googleMaps';

// Mock loadGoogleMapsScript
vi.mock('../../utils/loadGoogleMapsScript', () => ({
  loadGoogleMapsScript: vi.fn().mockResolvedValue(undefined),
}));

// Mock apiService
vi.mock('../../services/apiService', () => ({
  fetchAndProcessLocations: vi.fn().mockResolvedValue([]),
}));

describe('Overlay Navigation', () => {
  beforeEach(() => {
    mockGoogleMaps();
    vi.clearAllMocks();
  });

  describe('URL Encoding', () => {
    it('should have encodeFiltersToURL available', async () => {
      const module = await import('../../utils/urlSync');

      expect(module.encodeFiltersToURL).toBeDefined();
    });

    it('should have parseFiltersFromURL available', async () => {
      const module = await import('../../utils/urlSync');

      expect(module.parseFiltersFromURL).toBeDefined();
    });
  });

  describe('Shop Detail URL Generation', () => {
    it('should generate shop detail base path', async () => {
      const { getShopDetailBasePath } = await import('../../utils/typeUrlMappings');

      expect(getShopDetailBasePath('farm_stand')).toBe('/farm-stand');
      expect(getShopDetailBasePath('cheese_shop')).toBe('/cheesemonger');
      expect(getShopDetailBasePath('fish_monger')).toBe('/fishmonger');
    });
  });

  describe('Type Filter Page Detection', () => {
    it('should detect type filter pages', async () => {
      const { isTypeFilterPage } = await import('../../utils/typeUrlMappings');

      expect(isTypeFilterPage('/all')).toBe(true);
      expect(isTypeFilterPage('/farm-stand')).toBe(true);
      expect(isTypeFilterPage('/cheesemonger')).toBe(true);
    });

    it('should not detect shop detail pages as filter pages', async () => {
      const { isTypeFilterPage } = await import('../../utils/typeUrlMappings');

      expect(isTypeFilterPage('/farm-stand/happy-acres')).toBe(false);
      expect(isTypeFilterPage('/cheesemonger/maine-cheese')).toBe(false);
    });
  });
});
