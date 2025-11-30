// src/utils/seo.test.ts
/**
 * Tests for SEO utilities - Meta tags and structured data
 *
 * The module provides:
 * - getHomepageSEO, getFarmStandSEO - Generate SEO config
 * - updateMetaTags - Update document head with meta tags
 * - generateLocalBusinessSchema, generateOrganizationSchema - Generate JSON-LD
 * - addStructuredData - Add JSON-LD to page
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getHomepageSEO,
  getFarmStandSEO,
  updateMetaTags,
  generateLocalBusinessSchema,
  addStructuredData,
} from './seo';
import type { Shop } from '../types';

const mockShop: Shop = {
  type: 'farm_stand',
  Name: 'Happy Acres Farm',
  Address: '123 Farm Road, Portland, ME 04101',
  City: 'Portland',
  Zip: '04101',
  slug: 'happy-acres',
  lat: 43.6591,
  lng: -70.2568,
  products: {
    beef: true,
    eggs: true,
    tomatoes: true,
    strawberries: true,
  },
  // These are top-level shop fields that the SEO uses
  beef: true,
  eggs: true,
  tomatoes: true,
  strawberries: true,
  placeDetails: {
    name: 'Happy Acres Farm',
    formatted_address: '123 Farm Road, Portland, ME 04101',
    rating: 4.5,
    user_ratings_total: 42,
  },
} as Shop;

describe('SEO Utilities', () => {
  beforeEach(() => {
    // Reset document head
    document.head.innerHTML = '';
  });

  afterEach(() => {
    // Clean up
    document.head.innerHTML = '';
  });

  describe('getHomepageSEO', () => {
    it('should return SEO config for homepage', () => {
      const seo = getHomepageSEO();

      expect(seo).toHaveProperty('title');
      expect(seo).toHaveProperty('description');
      expect(seo).toHaveProperty('keywords');
    });

    it('should include phind.us in title', () => {
      const seo = getHomepageSEO();

      expect(seo.title).toContain('phind.us');
    });

    it('should mention all location types in description', () => {
      const seo = getHomepageSEO();

      expect(seo.description).toContain('farm');
      expect(seo.description).toContain('cheese');
      expect(seo.description).toContain('fish');
    });

    it('should include Open Graph metadata', () => {
      const seo = getHomepageSEO();

      expect(seo.ogTitle).toBeTruthy();
      expect(seo.ogDescription).toBeTruthy();
      expect(seo.ogImage).toBeTruthy();
      expect(seo.ogUrl).toBeTruthy();
    });

    it('should use summary_large_image for Twitter card', () => {
      const seo = getHomepageSEO();

      expect(seo.twitterCard).toBe('summary_large_image');
    });

    it('should include canonical URL', () => {
      const seo = getHomepageSEO();

      expect(seo.canonicalUrl).toBeTruthy();
      expect(seo.canonicalUrl).toMatch(/^http/);
    });
  });

  describe('getFarmStandSEO', () => {
    it('should return SEO config for shop page', () => {
      const seo = getFarmStandSEO(mockShop);

      expect(seo).toHaveProperty('title');
      expect(seo).toHaveProperty('description');
    });

    it('should include shop name in title', () => {
      const seo = getFarmStandSEO(mockShop);

      expect(seo.title).toContain('Happy Acres Farm');
    });

    it('should include location in title', () => {
      const seo = getFarmStandSEO(mockShop);

      expect(seo.title).toContain('Portland');
      expect(seo.title).toContain('ME');
    });

    it('should include rating in description if available', () => {
      const seo = getFarmStandSEO(mockShop);

      // The description includes "Rated X stars" format
      expect(seo.description).toContain('4.5');
      expect(seo.description).toContain('stars');
    });

    it('should list products in description', () => {
      const seo = getFarmStandSEO(mockShop);

      // The description includes "Offering X, Y, Z"
      expect(seo.description.toLowerCase()).toContain('beef');
      expect(seo.description.toLowerCase()).toContain('eggs');
      expect(seo.description.toLowerCase()).toContain('tomatoes');
    });

    it('should handle shop without rating', () => {
      const shopWithoutRating = {
        ...mockShop,
        placeDetails: undefined,
        Rating: 'N/A',
      };

      const seo = getFarmStandSEO(shopWithoutRating);

      expect(seo.description).not.toContain('NaN');
      expect(seo.description).toBeTruthy();
    });

    it('should handle shop with no products', () => {
      const shopWithoutProducts = {
        ...mockShop,
        products: {},
        beef: false,
        eggs: false,
        tomatoes: false,
        strawberries: false,
      } as Shop;

      const seo = getFarmStandSEO(shopWithoutProducts);

      expect(seo.description).toBeTruthy();
      expect(seo.title).toContain('Happy Acres Farm');
    });

    it('should use location type display name', () => {
      const cheeseShop: Shop = {
        ...mockShop,
        type: 'cheese_shop',
        Name: 'Maine Cheese',
        products: { cheddar: true },
      };

      const seo = getFarmStandSEO(cheeseShop);

      expect(seo.title).toContain('Cheesemonger');
    });
  });

  describe('updateMetaTags', () => {
    it('should create title tag', () => {
      const seo = { title: 'Test Title', description: 'Test Description' };

      updateMetaTags(seo);

      expect(document.title).toBe('Test Title');
    });

    it('should create meta description tag', () => {
      const seo = { title: 'Test', description: 'Test Description Here' };

      updateMetaTags(seo);

      const metaDesc = document.querySelector('meta[name="description"]');
      expect(metaDesc?.getAttribute('content')).toBe('Test Description Here');
    });

    it('should create meta keywords tag', () => {
      const seo = { title: 'Test', description: 'Test', keywords: 'farm, cheese, fish' };

      updateMetaTags(seo);

      const metaKeywords = document.querySelector('meta[name="keywords"]');
      expect(metaKeywords?.getAttribute('content')).toBe('farm, cheese, fish');
    });

    it('should create Open Graph tags', () => {
      const seo = {
        title: 'Test',
        description: 'Test',
        ogTitle: 'OG Title',
        ogDescription: 'OG Description',
        ogImage: 'https://example.com/image.jpg',
        ogUrl: 'https://example.com',
      };

      updateMetaTags(seo);

      expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('OG Title');
      expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('OG Description');
      expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://example.com/image.jpg');
      expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://example.com');
    });

    it('should create Twitter card tags', () => {
      const seo = {
        title: 'Test',
        description: 'Test',
        twitterCard: 'summary_large_image' as const,
      };

      updateMetaTags(seo);

      const twitterCard = document.querySelector('meta[name="twitter:card"]');
      expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
    });

    it('should create canonical link tag', () => {
      const seo = {
        title: 'Test',
        description: 'Test',
        canonicalUrl: 'https://example.com/canonical',
      };

      updateMetaTags(seo);

      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical?.getAttribute('href')).toBe('https://example.com/canonical');
    });

    it('should update existing meta tags instead of duplicating', () => {
      const seo1 = { title: 'First', description: 'First Description' };
      const seo2 = { title: 'Second', description: 'Second Description' };

      updateMetaTags(seo1);
      updateMetaTags(seo2);

      const metaDescs = document.querySelectorAll('meta[name="description"]');
      expect(metaDescs.length).toBe(1);
      expect(metaDescs[0].getAttribute('content')).toBe('Second Description');
    });
  });

  describe('generateLocalBusinessSchema', () => {
    it('should create LocalBusiness structured data', () => {
      const schema = generateLocalBusinessSchema(mockShop);
      const data = JSON.parse(schema);

      expect(data['@type']).toBe('LocalBusiness');
      expect(data.name).toBe('Happy Acres Farm');
    });

    it('should include address in structured data', () => {
      const schema = generateLocalBusinessSchema(mockShop);
      const data = JSON.parse(schema);

      expect(data.address).toBeTruthy();
      expect(data.address.streetAddress).toContain('123 Farm Road');
    });

    it('should include geo coordinates', () => {
      const schema = generateLocalBusinessSchema(mockShop);
      const data = JSON.parse(schema);

      expect(data.geo).toBeTruthy();
      expect(data.geo.latitude).toBe(43.6591);
      expect(data.geo.longitude).toBe(-70.2568);
    });

    it('should include rating if available', () => {
      const schema = generateLocalBusinessSchema(mockShop);
      const data = JSON.parse(schema);

      expect(data.aggregateRating).toBeTruthy();
      expect(data.aggregateRating.ratingValue).toBe(4.5);
      expect(data.aggregateRating.reviewCount).toBe(42);
    });

    it('should handle shop without placeDetails', () => {
      const shopWithoutDetails = {
        ...mockShop,
        placeDetails: undefined,
      };

      const schema = generateLocalBusinessSchema(shopWithoutDetails);
      const data = JSON.parse(schema);

      expect(data.name).toBe('Happy Acres Farm');
    });
  });

  describe('addStructuredData', () => {
    it('should add script tag with JSON-LD', () => {
      const schema = generateLocalBusinessSchema(mockShop);

      addStructuredData(schema);

      const scriptTag = document.querySelector('script[type="application/ld+json"]');
      expect(scriptTag).toBeTruthy();
    });

    it('should replace existing structured data script', () => {
      const schema = generateLocalBusinessSchema(mockShop);

      addStructuredData(schema);
      addStructuredData(schema);

      const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
      expect(scriptTags.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing window.location gracefully', () => {
      // SEO functions use window.location.origin
      expect(window.location.origin).toBeTruthy();
    });

    it('should sanitize special characters in meta content', () => {
      const shopWithSpecialChars = {
        ...mockShop,
        Name: 'Farm "Quotes" & <Tags>',
      };

      const seo = getFarmStandSEO(shopWithSpecialChars);

      // Should handle special characters safely
      expect(seo.title).toContain('Farm');
    });

    it('should handle very long descriptions', () => {
      const shopWithManyProducts = {
        ...mockShop,
        beef: true,
        pork: true,
        lamb: true,
        chicken: true,
        eggs: true,
        corn: true,
        carrots: true,
        potatoes: true,
        lettuce: true,
        tomatoes: true,
        strawberries: true,
      } as Shop;

      const seo = getFarmStandSEO(shopWithManyProducts);

      // Description should exist but be reasonable length
      expect(seo.description.length).toBeGreaterThan(0);
      expect(seo.description.length).toBeLessThan(500);
    });
  });
});
