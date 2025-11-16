// src/utils/socialMediaHelpers.ts
// Helper functions for constructing and validating social media URLs

import { Shop } from '../types';

/**
 * Constructs Instagram profile URL from shop data
 * Prioritizes InstagramLink, falls back to constructing from username
 */
export function getInstagramUrl(shop: Shop): string | null {
  // First try the full link if available
  if (shop.InstagramLink) {
    const cleanLink = shop.InstagramLink.trim();
    if (cleanLink.startsWith('http')) {
      return cleanLink;
    }
    // If it's just a username without http, construct the URL
    return `https://www.instagram.com/${cleanLink.replace('@', '')}`;
  }

  // Fall back to constructing from username
  if (shop.InstagramUsername) {
    const username = shop.InstagramUsername.trim().replace('@', '');
    return `https://www.instagram.com/${username}`;
  }

  return null;
}

/**
 * Gets display name for Instagram (username without @)
 */
export function getInstagramDisplayName(shop: Shop): string | null {
  if (shop.InstagramUsername) {
    return shop.InstagramUsername.trim().replace('@', '');
  }

  if (shop.InstagramLink) {
    // Extract username from URL like https://www.instagram.com/username/
    const match = shop.InstagramLink.match(/instagram\.com\/([^\/\?]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Constructs Facebook page URL from shop data
 * Normalizes various Facebook page ID formats
 */
export function getFacebookUrl(shop: Shop): string | null {
  if (!shop.FacebookPageID) {
    return null;
  }

  let pageId = shop.FacebookPageID.trim();

  // Remove trailing slashes
  pageId = pageId.replace(/\/+$/, '');

  // If it's already a full URL, validate and return
  if (pageId.startsWith('http')) {
    return pageId;
  }

  // Handle various Facebook ID formats:
  // - Simple username: "BradburyMountainFarm"
  // - Numeric ID: "100064767608374"
  // - Complex path: "Anderson-Farms-Farmers-Daughters-Farm-Stand-100064618695038"

  // Remove any "facebook.com/" prefix if accidentally included
  pageId = pageId.replace(/^.*facebook\.com\//, '');

  // Construct the URL
  return `https://www.facebook.com/${pageId}`;
}

/**
 * Gets display name for Facebook page
 */
export function getFacebookDisplayName(shop: Shop): string | null {
  if (!shop.FacebookPageID) {
    return null;
  }

  let pageId = shop.FacebookPageID.trim().replace(/\/+$/, '');

  // Remove any URL prefix
  pageId = pageId.replace(/^.*facebook\.com\//, '');

  // If it's a numeric ID, show the farm name instead
  if (/^\d+$/.test(pageId)) {
    return shop.Name || 'Facebook Page';
  }

  return pageId;
}

/**
 * Constructs Twitter/X profile URL from shop data
 */
export function getTwitterUrl(shop: Shop): string | null {
  if (!shop.TwitterHandle) {
    return null;
  }

  const handle = shop.TwitterHandle.trim().replace('@', '');

  // Use x.com (Twitter's rebranded domain)
  return `https://x.com/${handle}`;
}

/**
 * Gets display name for Twitter/X (handle with @)
 */
export function getTwitterDisplayName(shop: Shop): string | null {
  if (!shop.TwitterHandle) {
    return null;
  }

  const handle = shop.TwitterHandle.trim();
  return handle.startsWith('@') ? handle : `@${handle}`;
}

/**
 * Checks if shop has any social media accounts
 */
export function hasSocialMedia(shop: Shop): boolean {
  return !!(
    shop.InstagramUsername ||
    shop.InstagramLink ||
    shop.FacebookPageID ||
    shop.TwitterHandle
  );
}

/**
 * Gets count of available social media platforms for a shop
 */
export function getSocialMediaCount(shop: Shop): number {
  let count = 0;
  if (shop.InstagramUsername || shop.InstagramLink) count++;
  if (shop.FacebookPageID) count++;
  if (shop.TwitterHandle) count++;
  return count;
}
