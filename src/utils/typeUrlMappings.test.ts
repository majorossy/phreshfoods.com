// src/utils/typeUrlMappings.test.ts
import { describe, it, expect } from 'vitest';
import {
  typeToUrlSlug,
  urlSlugToType,
  encodeTypesToPath,
  parseTypesFromPath,
  getShopDetailBasePath,
  isTypeFilterPage,
  getDisplayName,
  getEmoji,
  getDisplayConfig,
} from './typeUrlMappings';
import type { LocationType } from '../types/shop';
import { ALL_LOCATION_TYPES } from '../types/shop';

describe('typeUrlMappings', () => {
  describe('typeToUrlSlug', () => {
    it('should convert farm_stand to farms', () => {
      expect(typeToUrlSlug('farm_stand')).toBe('farms');
    });

    it('should convert cheese_shop to cheese', () => {
      expect(typeToUrlSlug('cheese_shop')).toBe('cheese');
    });

    it('should convert fish_monger to fish', () => {
      expect(typeToUrlSlug('fish_monger')).toBe('fish');
    });

    it('should convert butcher to butchers', () => {
      expect(typeToUrlSlug('butcher')).toBe('butchers');
    });

    it('should convert antique_shop to antiques', () => {
      expect(typeToUrlSlug('antique_shop')).toBe('antiques');
    });

    it('should convert brewery to breweries', () => {
      expect(typeToUrlSlug('brewery')).toBe('breweries');
    });

    it('should convert winery to wineries', () => {
      expect(typeToUrlSlug('winery')).toBe('wineries');
    });

    it('should convert sugar_shack to sugar-shacks', () => {
      expect(typeToUrlSlug('sugar_shack')).toBe('sugar-shacks');
    });

    it('should handle all location types without errors', () => {
      ALL_LOCATION_TYPES.forEach(type => {
        expect(() => typeToUrlSlug(type)).not.toThrow();
        expect(typeToUrlSlug(type)).toBeTruthy();
      });
    });
  });

  describe('urlSlugToType', () => {
    it('should convert farms to farm_stand', () => {
      expect(urlSlugToType('farms')).toBe('farm_stand');
    });

    it('should convert cheese to cheese_shop', () => {
      expect(urlSlugToType('cheese')).toBe('cheese_shop');
    });

    it('should convert fish to fish_monger', () => {
      expect(urlSlugToType('fish')).toBe('fish_monger');
    });

    it('should convert butchers to butcher', () => {
      expect(urlSlugToType('butchers')).toBe('butcher');
    });

    it('should convert antiques to antique_shop', () => {
      expect(urlSlugToType('antiques')).toBe('antique_shop');
    });

    it('should convert breweries to brewery', () => {
      expect(urlSlugToType('breweries')).toBe('brewery');
    });

    it('should convert wineries to winery', () => {
      expect(urlSlugToType('wineries')).toBe('winery');
    });

    it('should convert sugar-shacks to sugar_shack', () => {
      expect(urlSlugToType('sugar-shacks')).toBe('sugar_shack');
    });

    it('should return null for invalid slug', () => {
      expect(urlSlugToType('invalid-slug')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(urlSlugToType('')).toBeNull();
    });

    it('should be case-sensitive', () => {
      expect(urlSlugToType('Farms')).toBeNull();
      expect(urlSlugToType('FARMS')).toBeNull();
    });
  });

  describe('encodeTypesToPath', () => {
    it('should return "all" when all types are selected', () => {
      const allTypes = new Set<LocationType>(ALL_LOCATION_TYPES);
      expect(encodeTypesToPath(allTypes)).toBe('all');
    });

    it('should return single slug for single type', () => {
      const singleType = new Set<LocationType>(['farm_stand']);
      expect(encodeTypesToPath(singleType)).toBe('farms');
    });

    it('should return slugs joined with + for multiple types', () => {
      const multipleTypes = new Set<LocationType>(['farm_stand', 'cheese_shop']);
      expect(encodeTypesToPath(multipleTypes)).toBe('cheese+farms');
    });

    it('should sort types alphabetically by slug', () => {
      const types = new Set<LocationType>(['fish_monger', 'antique_shop', 'butcher']);
      // antiques, butchers, fish (alphabetically)
      expect(encodeTypesToPath(types)).toBe('antiques+butchers+fish');
    });

    it('should handle all possible two-type combinations', () => {
      const type1: LocationType = 'farm_stand';
      const type2: LocationType = 'cheese_shop';
      const types = new Set<LocationType>([type1, type2]);
      const result = encodeTypesToPath(types);

      expect(result).toContain('+');
      expect(result.split('+')).toHaveLength(2);
      expect(result).toMatch(/^(cheese|farms)\+(cheese|farms)$/);
    });

    it('should handle empty set by returning path for no types', () => {
      const emptyTypes = new Set<LocationType>([]);
      const result = encodeTypesToPath(emptyTypes);
      // Empty set should produce empty string when joined
      expect(result).toBe('');
    });
  });

  describe('parseTypesFromPath', () => {
    it('should return all types for "all"', () => {
      const result = parseTypesFromPath('all');
      expect(result.size).toBe(ALL_LOCATION_TYPES.length);
      ALL_LOCATION_TYPES.forEach(type => {
        expect(result.has(type)).toBe(true);
      });
    });

    it('should return all types for empty string', () => {
      const result = parseTypesFromPath('');
      expect(result.size).toBe(ALL_LOCATION_TYPES.length);
    });

    it('should return all types for "/"', () => {
      const result = parseTypesFromPath('/');
      expect(result.size).toBe(ALL_LOCATION_TYPES.length);
    });

    it('should return all types for undefined', () => {
      const result = parseTypesFromPath(undefined);
      expect(result.size).toBe(ALL_LOCATION_TYPES.length);
    });

    it('should parse single type from slug', () => {
      const result = parseTypesFromPath('farms');
      expect(result.size).toBe(1);
      expect(result.has('farm_stand')).toBe(true);
    });

    it('should parse multiple types from slug with +', () => {
      const result = parseTypesFromPath('farms+cheese');
      expect(result.size).toBe(2);
      expect(result.has('farm_stand')).toBe(true);
      expect(result.has('cheese_shop')).toBe(true);
    });

    it('should handle path with leading slash', () => {
      const result = parseTypesFromPath('/farms');
      expect(result.size).toBe(1);
      expect(result.has('farm_stand')).toBe(true);
    });

    it('should handle complex multi-type path', () => {
      const result = parseTypesFromPath('farms+cheese+fish+butchers');
      expect(result.size).toBe(4);
      expect(result.has('farm_stand')).toBe(true);
      expect(result.has('cheese_shop')).toBe(true);
      expect(result.has('fish_monger')).toBe(true);
      expect(result.has('butcher')).toBe(true);
    });

    it('should return all types for invalid slug (graceful fallback)', () => {
      const result = parseTypesFromPath('invalid-slug');
      expect(result.size).toBe(ALL_LOCATION_TYPES.length);
    });

    it('should filter out invalid slugs but keep valid ones', () => {
      const result = parseTypesFromPath('farms+invalid+cheese');
      expect(result.size).toBe(2);
      expect(result.has('farm_stand')).toBe(true);
      expect(result.has('cheese_shop')).toBe(true);
    });

    it('should return all types if all slugs are invalid', () => {
      const result = parseTypesFromPath('invalid1+invalid2');
      expect(result.size).toBe(ALL_LOCATION_TYPES.length);
    });

    it('should handle all valid type slugs', () => {
      const allSlugs = ALL_LOCATION_TYPES.map(type => typeToUrlSlug(type)).join('+');
      const result = parseTypesFromPath(allSlugs);
      expect(result.size).toBe(ALL_LOCATION_TYPES.length);
    });
  });

  describe('getShopDetailBasePath', () => {
    it('should return /farm for farm_stand', () => {
      expect(getShopDetailBasePath('farm_stand')).toBe('/farm');
    });

    it('should return /cheese for cheese_shop', () => {
      expect(getShopDetailBasePath('cheese_shop')).toBe('/cheese');
    });

    it('should return /fish for fish_monger', () => {
      expect(getShopDetailBasePath('fish_monger')).toBe('/fish');
    });

    it('should return /butcher for butcher', () => {
      expect(getShopDetailBasePath('butcher')).toBe('/butcher');
    });

    it('should return /antique for antique_shop', () => {
      expect(getShopDetailBasePath('antique_shop')).toBe('/antique');
    });

    it('should return /brewery for brewery', () => {
      expect(getShopDetailBasePath('brewery')).toBe('/brewery');
    });

    it('should return /winery for winery', () => {
      expect(getShopDetailBasePath('winery')).toBe('/winery');
    });

    it('should return /sugar-shack for sugar_shack', () => {
      expect(getShopDetailBasePath('sugar_shack')).toBe('/sugar-shack');
    });

    it('should handle all location types', () => {
      ALL_LOCATION_TYPES.forEach(type => {
        const basePath = getShopDetailBasePath(type);
        expect(basePath).toMatch(/^\/[a-z-]+$/);
        expect(basePath).not.toContain(' ');
      });
    });

    it('should return paths starting with /', () => {
      ALL_LOCATION_TYPES.forEach(type => {
        expect(getShopDetailBasePath(type)).toMatch(/^\//);
      });
    });
  });

  describe('isTypeFilterPage', () => {
    it('should return true for /all', () => {
      expect(isTypeFilterPage('/all')).toBe(true);
    });

    it('should return true for all without leading slash', () => {
      expect(isTypeFilterPage('all')).toBe(true);
    });

    it('should return true for single type slug', () => {
      expect(isTypeFilterPage('/farms')).toBe(true);
      expect(isTypeFilterPage('farms')).toBe(true);
    });

    it('should return true for multiple type slugs with +', () => {
      expect(isTypeFilterPage('/farms+cheese')).toBe(true);
      expect(isTypeFilterPage('farms+cheese')).toBe(true);
    });

    it('should return true for all valid type slugs', () => {
      ALL_LOCATION_TYPES.forEach(type => {
        const slug = typeToUrlSlug(type);
        expect(isTypeFilterPage(`/${slug}`)).toBe(true);
        expect(isTypeFilterPage(slug)).toBe(true);
      });
    });

    it('should return false for shop detail paths with two segments', () => {
      expect(isTypeFilterPage('/farm/happy-acres')).toBe(false);
      expect(isTypeFilterPage('/cheese/maine-cheese')).toBe(false);
    });

    it('should return false for paths with multiple segments', () => {
      expect(isTypeFilterPage('/farm/happy-acres/details')).toBe(false);
    });

    it('should return false for invalid type slugs', () => {
      expect(isTypeFilterPage('/invalid-slug')).toBe(false);
      expect(isTypeFilterPage('invalid-slug')).toBe(false);
    });

    it('should return false for mixed valid/invalid slugs', () => {
      expect(isTypeFilterPage('/farms+invalid')).toBe(false);
    });

    it('should return false for root path /', () => {
      expect(isTypeFilterPage('/')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isTypeFilterPage('')).toBe(false);
    });

    it('should handle complex multi-type paths', () => {
      expect(isTypeFilterPage('/farms+cheese+fish')).toBe(true);
      expect(isTypeFilterPage('/antiques+breweries+wineries')).toBe(true);
    });
  });

  describe('Round-trip conversions', () => {
    it('should maintain consistency in type -> slug -> type conversion', () => {
      ALL_LOCATION_TYPES.forEach(type => {
        const slug = typeToUrlSlug(type);
        const convertedBack = urlSlugToType(slug);
        expect(convertedBack).toBe(type);
      });
    });

    it('should maintain consistency in encode -> parse conversion for single type', () => {
      const originalTypes = new Set<LocationType>(['farm_stand']);
      const path = encodeTypesToPath(originalTypes);
      const parsedTypes = parseTypesFromPath(path);

      expect(parsedTypes.size).toBe(1);
      expect(parsedTypes.has('farm_stand')).toBe(true);
    });

    it('should maintain consistency in encode -> parse conversion for multiple types', () => {
      const originalTypes = new Set<LocationType>(['farm_stand', 'cheese_shop', 'fish_monger']);
      const path = encodeTypesToPath(originalTypes);
      const parsedTypes = parseTypesFromPath(path);

      expect(parsedTypes.size).toBe(originalTypes.size);
      originalTypes.forEach(type => {
        expect(parsedTypes.has(type)).toBe(true);
      });
    });

    it('should maintain consistency in encode -> parse conversion for all types', () => {
      const allTypes = new Set<LocationType>(ALL_LOCATION_TYPES);
      const path = encodeTypesToPath(allTypes);
      const parsedTypes = parseTypesFromPath(path);

      expect(parsedTypes.size).toBe(ALL_LOCATION_TYPES.length);
      ALL_LOCATION_TYPES.forEach(type => {
        expect(parsedTypes.has(type)).toBe(true);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle types with special characters in slugs', () => {
      const type: LocationType = 'sugar_shack';
      const slug = typeToUrlSlug(type);
      expect(slug).toContain('-'); // sugar-shacks has hyphen

      const convertedBack = urlSlugToType(slug);
      expect(convertedBack).toBe(type);
    });

    it('should handle deterministic sorting in multi-type encoding', () => {
      // Same types in different order should produce same result
      const types1 = new Set<LocationType>(['cheese_shop', 'farm_stand']);
      const types2 = new Set<LocationType>(['farm_stand', 'cheese_shop']);

      expect(encodeTypesToPath(types1)).toBe(encodeTypesToPath(types2));
    });

    it('should handle URL-safe characters only in slugs', () => {
      ALL_LOCATION_TYPES.forEach(type => {
        const slug = typeToUrlSlug(type);
        // Should only contain lowercase letters, numbers, hyphens
        expect(slug).toMatch(/^[a-z0-9-]+$/);
      });
    });
  });

  describe('Display Name Utilities', () => {
    describe('getDisplayName', () => {
      it('should return singular form by default', () => {
        expect(getDisplayName('farm_stand')).toBe('Farm Stand');
        expect(getDisplayName('cheese_shop')).toBe('Cheesemonger');
        expect(getDisplayName('fish_monger')).toBe('Fishmonger');
        expect(getDisplayName('butcher')).toBe('Butcher');
        expect(getDisplayName('antique_shop')).toBe('Antiques');
      });

      it('should return plural form when requested', () => {
        expect(getDisplayName('farm_stand', true)).toBe('Farm Stands');
        expect(getDisplayName('cheese_shop', true)).toBe('Cheesemongers');
        expect(getDisplayName('fish_monger', true)).toBe('Fishmongers');
        expect(getDisplayName('butcher', true)).toBe('Butchers');
        expect(getDisplayName('antique_shop', true)).toBe('Antiques');
      });

      it('should use professional terminology', () => {
        // Ensure we use "Cheesemonger" not "Cheese Shop"
        expect(getDisplayName('cheese_shop')).toBe('Cheesemonger');
        expect(getDisplayName('cheese_shop')).not.toBe('Cheese Shop');

        // Ensure we use "Fishmonger" (one word) not "Fish Monger"
        expect(getDisplayName('fish_monger')).toBe('Fishmonger');
        expect(getDisplayName('fish_monger')).not.toBe('Fish Monger');

        // Ensure we use "Antiques" not "Antique Shops"
        expect(getDisplayName('antique_shop')).toBe('Antiques');
        expect(getDisplayName('antique_shop')).not.toBe('Antique Shops');
      });

      it('should handle all location types', () => {
        ALL_LOCATION_TYPES.forEach(type => {
          const singular = getDisplayName(type, false);
          const plural = getDisplayName(type, true);

          expect(singular).toBeTruthy();
          expect(plural).toBeTruthy();
          expect(typeof singular).toBe('string');
          expect(typeof plural).toBe('string');
        });
      });
    });

    describe('getEmoji', () => {
      it('should return correct emoji for each type', () => {
        expect(getEmoji('farm_stand')).toBe('🚜');
        expect(getEmoji('cheese_shop')).toBe('🧀');
        expect(getEmoji('fish_monger')).toBe('🐟');
        expect(getEmoji('butcher')).toBe('🥩');
        expect(getEmoji('antique_shop')).toBe('🏺');
        expect(getEmoji('brewery')).toBe('🍺');
        expect(getEmoji('winery')).toBe('🍷');
        expect(getEmoji('sugar_shack')).toBe('🍁');
      });

      it('should return emoji for all location types', () => {
        ALL_LOCATION_TYPES.forEach(type => {
          const emoji = getEmoji(type);
          expect(emoji).toBeTruthy();
          expect(typeof emoji).toBe('string');
          // Emoji should be a single character (or multi-byte unicode)
          expect(emoji.length).toBeGreaterThan(0);
        });
      });
    });

    describe('getDisplayConfig', () => {
      it('should return complete config object', () => {
        const config = getDisplayConfig('cheese_shop');

        expect(config).toHaveProperty('singular');
        expect(config).toHaveProperty('plural');
        expect(config).toHaveProperty('emoji');

        expect(config.singular).toBe('Cheesemonger');
        expect(config.plural).toBe('Cheesemongers');
        expect(config.emoji).toBe('🧀');
      });

      it('should return config for all location types', () => {
        ALL_LOCATION_TYPES.forEach(type => {
          const config = getDisplayConfig(type);

          expect(config).toHaveProperty('singular');
          expect(config).toHaveProperty('plural');
          expect(config).toHaveProperty('emoji');

          expect(typeof config.singular).toBe('string');
          expect(typeof config.plural).toBe('string');
          expect(typeof config.emoji).toBe('string');

          expect(config.singular).toBeTruthy();
          expect(config.plural).toBeTruthy();
          expect(config.emoji).toBeTruthy();
        });
      });

      it('should have consistent singular/plural naming', () => {
        // Farm Stand/Farm Stands
        const farmConfig = getDisplayConfig('farm_stand');
        expect(farmConfig.singular).toBe('Farm Stand');
        expect(farmConfig.plural).toBe('Farm Stands');

        // Cheesemonger/Cheesemongers
        const cheeseConfig = getDisplayConfig('cheese_shop');
        expect(cheeseConfig.singular).toBe('Cheesemonger');
        expect(cheeseConfig.plural).toBe('Cheesemongers');

        // Fishmonger/Fishmongers
        const fishConfig = getDisplayConfig('fish_monger');
        expect(fishConfig.singular).toBe('Fishmonger');
        expect(fishConfig.plural).toBe('Fishmongers');

        // Antiques/Antiques (same for both)
        const antiqueConfig = getDisplayConfig('antique_shop');
        expect(antiqueConfig.singular).toBe('Antiques');
        expect(antiqueConfig.plural).toBe('Antiques');
      });
    });

    describe('Integration with other utilities', () => {
      it('should have matching emoji between config and helper', () => {
        ALL_LOCATION_TYPES.forEach(type => {
          const config = getDisplayConfig(type);
          const emoji = getEmoji(type);

          expect(config.emoji).toBe(emoji);
        });
      });

      it('should have matching names between config and helper', () => {
        ALL_LOCATION_TYPES.forEach(type => {
          const config = getDisplayConfig(type);
          const singular = getDisplayName(type, false);
          const plural = getDisplayName(type, true);

          expect(config.singular).toBe(singular);
          expect(config.plural).toBe(plural);
        });
      });
    });
  });
});
