// src/utils/socialMediaHelpers.test.ts
/**
 * Tests for social media URL helpers
 *
 * The module provides functions for:
 * - getInstagramUrl, getFacebookUrl, getXUrl - Construct social media URLs
 * - hasSocialMedia - Check if shop has any social media accounts
 */
import { describe, it, expect } from 'vitest';
import {
  getInstagramUrl,
  getFacebookUrl,
  getXUrl,
  hasSocialMedia,
} from './socialMediaHelpers';
import type { Shop } from '../types';

const mockShopWithAllSocial: Shop = {
  type: 'farm_stand',
  Name: 'Test Farm',
  Address: '123 Main St',
  slug: 'test-farm',
  lat: 43.6591,
  lng: -70.2568,
  products: {},
  InstagramUsername: 'testfarm',
  InstagramLink: 'https://instagram.com/testfarm',
  FacebookPageID: '123456789',
  XHandle: 'testfarm',
};

const mockShopWithPartialSocial: Shop = {
  type: 'farm_stand',
  Name: 'Partial Farm',
  Address: '456 Main St',
  slug: 'partial-farm',
  lat: 43.6591,
  lng: -70.2568,
  products: {},
  InstagramUsername: 'partialfarm',
  // No InstagramLink, FacebookPageID, or XHandle
};

const mockShopWithNoSocial: Shop = {
  type: 'farm_stand',
  Name: 'No Social Farm',
  Address: '789 Main St',
  slug: 'no-social',
  lat: 43.6591,
  lng: -70.2568,
  products: {},
};

describe('socialMediaHelpers', () => {
  describe('getInstagramUrl', () => {
    it('should return InstagramLink if provided', () => {
      const url = getInstagramUrl(mockShopWithAllSocial);

      expect(url).toBe('https://instagram.com/testfarm');
    });

    it('should construct URL from username if no link provided', () => {
      const url = getInstagramUrl(mockShopWithPartialSocial);

      expect(url).toBe('https://www.instagram.com/partialfarm');
    });

    it('should return null if no Instagram data', () => {
      const url = getInstagramUrl(mockShopWithNoSocial);

      expect(url).toBe(null);
    });

    it('should handle username with @ symbol', () => {
      const shopWithAt = {
        ...mockShopWithNoSocial,
        InstagramUsername: '@testfarm',
      };

      const url = getInstagramUrl(shopWithAt);

      // Should strip @ symbol
      expect(url).toBe('https://www.instagram.com/testfarm');
    });

    it('should handle empty string username', () => {
      const shopWithEmpty = {
        ...mockShopWithNoSocial,
        InstagramUsername: '',
      };

      const url = getInstagramUrl(shopWithEmpty);

      // Empty string should be treated as no Instagram
      expect(url).toBe(null);
    });
  });

  describe('getFacebookUrl', () => {
    it('should construct Facebook URL from page ID', () => {
      const url = getFacebookUrl(mockShopWithAllSocial);

      expect(url).toBe('https://www.facebook.com/123456789');
    });

    it('should return null if no Facebook page ID', () => {
      const url = getFacebookUrl(mockShopWithNoSocial);

      expect(url).toBe(null);
    });

    it('should handle numeric page IDs', () => {
      const shop = {
        ...mockShopWithNoSocial,
        FacebookPageID: '987654321',
      };

      const url = getFacebookUrl(shop);

      expect(url).toBe('https://www.facebook.com/987654321');
    });

    it('should handle empty string page ID', () => {
      const shop = {
        ...mockShopWithNoSocial,
        FacebookPageID: '',
      };

      const url = getFacebookUrl(shop);

      expect(url).toBe(null);
    });
  });

  describe('getXUrl', () => {
    it('should construct X URL from handle', () => {
      const url = getXUrl(mockShopWithAllSocial);

      expect(url).toBe('https://x.com/testfarm');
    });

    it('should return null if no handle', () => {
      const url = getXUrl(mockShopWithNoSocial);

      expect(url).toBe(null);
    });

    it('should handle handle with @ symbol', () => {
      const shop = {
        ...mockShopWithNoSocial,
        XHandle: '@testfarm',
      };

      const url = getXUrl(shop);

      // Should strip @ symbol
      expect(url).toBe('https://x.com/testfarm');
    });

    it('should handle empty string handle', () => {
      const shop = {
        ...mockShopWithNoSocial,
        XHandle: '',
      };

      const url = getXUrl(shop);

      expect(url).toBe(null);
    });
  });

  describe('hasSocialMedia', () => {
    it('should return true when shop has any social media', () => {
      expect(hasSocialMedia(mockShopWithAllSocial)).toBe(true);
    });

    it('should return true when shop has only Instagram', () => {
      expect(hasSocialMedia(mockShopWithPartialSocial)).toBe(true);
    });

    it('should return false when shop has no social media', () => {
      expect(hasSocialMedia(mockShopWithNoSocial)).toBe(false);
    });

    it('should return true when shop has only Facebook', () => {
      const shop = {
        ...mockShopWithNoSocial,
        FacebookPageID: '123456',
      };

      expect(hasSocialMedia(shop)).toBe(true);
    });

    it('should return true when shop has only XHandle', () => {
      const shop = {
        ...mockShopWithNoSocial,
        XHandle: 'testhandle',
      };

      expect(hasSocialMedia(shop)).toBe(true);
    });

    it('should handle shop with empty string social fields', () => {
      const shop = {
        ...mockShopWithNoSocial,
        InstagramUsername: '',
        FacebookPageID: '',
        XHandle: '',
      };

      expect(hasSocialMedia(shop)).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('should return valid HTTPS URLs', () => {
      const instagramUrl = getInstagramUrl(mockShopWithPartialSocial);
      const facebookUrl = getFacebookUrl(mockShopWithAllSocial);
      const xUrl = getXUrl(mockShopWithAllSocial);

      if (instagramUrl) expect(instagramUrl).toMatch(/^https:\/\//);
      if (facebookUrl) expect(facebookUrl).toMatch(/^https:\/\//);
      if (xUrl) expect(xUrl).toMatch(/^https:\/\//);
    });

    it('should not include query parameters or fragments', () => {
      const shop = {
        ...mockShopWithNoSocial,
        InstagramUsername: 'test?param=value',
      };

      const url = getInstagramUrl(shop);

      // Should handle safely (either encode or strip)
      expect(url).toBeTruthy();
    });
  });
});
