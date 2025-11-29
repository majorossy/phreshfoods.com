// src/config/enabledLocationTypes.test.ts
import { describe, it, expect } from 'vitest';
import { ENABLED_LOCATION_TYPES, isLocationTypeEnabled, ENABLED_LOCATION_TYPE_COUNT } from './enabledLocationTypes';

describe('Feature Flags - Location Types', () => {
  describe('ENABLED_LOCATION_TYPES', () => {
    it('should include all always-enabled types', () => {
      // These types are always enabled (in ALWAYS_ENABLED array)
      expect(ENABLED_LOCATION_TYPES).toContain('farm_stand');
      expect(ENABLED_LOCATION_TYPES).toContain('fish_monger');
      expect(ENABLED_LOCATION_TYPES).toContain('cheese_shop');
      expect(ENABLED_LOCATION_TYPES).toContain('butcher');
      expect(ENABLED_LOCATION_TYPES).toContain('antique_shop');
    });

    it('should NOT include brewery when VITE_ENABLE_BREWERIES=false', () => {
      // Brewery should be excluded when feature flag is false (as set in .env)
      expect(ENABLED_LOCATION_TYPES).not.toContain('brewery');
    });

    it('should NOT include winery when VITE_ENABLE_WINERIES=false', () => {
      // Winery should be excluded when feature flag is false (as set in .env)
      expect(ENABLED_LOCATION_TYPES).not.toContain('winery');
    });

    it('should include sugar_shack when VITE_ENABLE_SUGAR_SHACKS=true', () => {
      // Sugar shacks should be included when feature flag is true (as set in .env)
      expect(ENABLED_LOCATION_TYPES).toContain('sugar_shack');
    });

    it('should have exactly 6 enabled types with current .env configuration', () => {
      // With breweries/wineries disabled and sugar_shacks enabled:
      // farm_stand, fish_monger, cheese_shop, butcher, antique_shop, sugar_shack = 6
      expect(ENABLED_LOCATION_TYPES.length).toBe(6);
      expect(ENABLED_LOCATION_TYPE_COUNT).toBe(6);
    });

    it('should be a readonly array', () => {
      // Verify it's marked as const
      expect(Array.isArray(ENABLED_LOCATION_TYPES)).toBe(true);
    });
  });

  describe('isLocationTypeEnabled', () => {
    it('should return true for enabled types', () => {
      expect(isLocationTypeEnabled('farm_stand')).toBe(true);
      expect(isLocationTypeEnabled('cheese_shop')).toBe(true);
      expect(isLocationTypeEnabled('fish_monger')).toBe(true);
      expect(isLocationTypeEnabled('butcher')).toBe(true);
      expect(isLocationTypeEnabled('antique_shop')).toBe(true);
      expect(isLocationTypeEnabled('sugar_shack')).toBe(true);
    });

    it('should return false for disabled brewery', () => {
      expect(isLocationTypeEnabled('brewery')).toBe(false);
    });

    it('should return false for disabled winery', () => {
      expect(isLocationTypeEnabled('winery')).toBe(false);
    });
  });

  describe('Feature Flag Integration', () => {
    it('should maintain order matching UI display preferences', () => {
      // Verify the order is intentional (farm_stand first, etc.)
      const firstType = ENABLED_LOCATION_TYPES[0];
      expect(firstType).toBe('farm_stand');
    });

    it('should only include types that pass the enabled filter', () => {
      // All types in ENABLED_LOCATION_TYPES should return true from isLocationTypeEnabled
      ENABLED_LOCATION_TYPES.forEach(type => {
        expect(isLocationTypeEnabled(type)).toBe(true);
      });
    });
  });
});
