// src/tests/integration/locationTypeFiltering.test.tsx
/**
 * Integration tests for location type filtering
 *
 * NOTE: Full App integration tests require extensive mocking and often cause
 * flaky tests. These tests verify the components can be imported and basic
 * setup works correctly.
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

describe('Location Type Filtering', () => {
  beforeEach(() => {
    mockGoogleMaps();
    vi.clearAllMocks();
  });

  describe('Feature Flag Configuration', () => {
    it('should have typeUrlMappings available', async () => {
      const module = await import('../../utils/typeUrlMappings');

      expect(module.typeToUrlSlug).toBeDefined();
      expect(module.urlSlugToType).toBeDefined();
      expect(module.getDisplayName).toBeDefined();
      expect(module.getEmoji).toBeDefined();
    });

    it('should have FilterContext available', async () => {
      const module = await import('../../contexts/FilterContext');

      expect(module.FilterProvider).toBeDefined();
      expect(module.useFilters).toBeDefined();
    });
  });

  describe('URL Mappings', () => {
    it('should convert farm_stand to farm-stand', async () => {
      const { typeToUrlSlug } = await import('../../utils/typeUrlMappings');

      expect(typeToUrlSlug('farm_stand')).toBe('farm-stand');
    });

    it('should convert cheese_shop to cheesemonger', async () => {
      const { typeToUrlSlug } = await import('../../utils/typeUrlMappings');

      expect(typeToUrlSlug('cheese_shop')).toBe('cheesemonger');
    });

    it('should round-trip type to slug and back', async () => {
      const { typeToUrlSlug, urlSlugToType } = await import('../../utils/typeUrlMappings');

      const original = 'farm_stand';
      const slug = typeToUrlSlug(original);
      const converted = urlSlugToType(slug);

      expect(converted).toBe(original);
    });
  });

  describe('Display Names', () => {
    it('should provide singular and plural names', async () => {
      const { getDisplayName } = await import('../../utils/typeUrlMappings');

      expect(getDisplayName('farm_stand', false)).toBe('Farm Stand');
      expect(getDisplayName('farm_stand', true)).toBe('Farm Stands');
    });

    it('should use professional terminology', async () => {
      const { getDisplayName } = await import('../../utils/typeUrlMappings');

      expect(getDisplayName('cheese_shop')).toBe('Cheesemonger');
      expect(getDisplayName('fish_monger')).toBe('Fishmonger');
    });
  });

  describe('Emojis', () => {
    it('should provide emoji for each type', async () => {
      const { getEmoji } = await import('../../utils/typeUrlMappings');

      expect(getEmoji('farm_stand')).toBe('🚜');
      expect(getEmoji('cheese_shop')).toBe('🧀');
      expect(getEmoji('fish_monger')).toBe('🐟');
      expect(getEmoji('butcher')).toBe('🥩');
    });
  });
});
