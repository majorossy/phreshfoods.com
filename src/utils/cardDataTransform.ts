// src/utils/cardDataTransform.ts
// @ts-nocheck - Temporarily disabled for production build testing
import type { Shop, ShopWithDistance, PlacePhoto, LocationType } from '../types';
import { getStatusInfo, type StatusInfo } from '../components/UI/StatusBadge';
import { getFeaturedReview, type ReviewSnippetData } from '../components/UI/ReviewSnippet';
import { getPreviewProducts, countAvailableProducts, type ProductItem } from '../components/UI/ProductPreview';

/**
 * Transformed card data for display
 * Pre-computes all derived values for optimal render performance
 */
export interface CardDisplayData {
  // Core identity
  id: string;
  name: string;
  slug: string;
  type: LocationType;

  // Location info
  city: string;
  address: string;
  fullAddress: string;
  distance?: string;
  distanceMeters?: number;

  // Status
  status: StatusInfo;
  isOpen: boolean;
  isClosed: boolean;

  // Rating & reviews
  rating: number;
  ratingCount: number;
  hasRating: boolean;
  featuredReview: ReviewSnippetData | null;

  // Photos
  photos: PlacePhoto[];
  photoCount: number;
  hasPhotos: boolean;
  primaryPhotoRef: string | null;

  // Products
  previewProducts: ProductItem[];
  totalProducts: number;
  hasProducts: boolean;

  // Contact
  phone: string | null;
  website: string | null;
  hasPhone: boolean;
  hasWebsite: boolean;

  // Location
  lat: number | null;
  lng: number | null;
  hasLocation: boolean;

  // Social
  googleMapsUrl: string | null;

  // Raw shop reference (for actions that need full data)
  shop: Shop;
}

/**
 * Transform shop data into optimized display format
 *
 * This function pre-computes all derived values so components
 * don't need to recalculate on every render.
 *
 * @param shop - The shop to transform
 * @param maxPreviewProducts - Maximum products to show in preview (default: 5)
 * @returns Transformed card display data
 */
export function transformShopToCardData(
  shop: Shop | ShopWithDistance,
  maxPreviewProducts: number = 5
): CardDisplayData {
  const placeDetails = shop.placeDetails;

  // Generate unique ID
  const id = shop.slug || shop.GoogleProfileID || `shop-${shop.Name?.toLowerCase().replace(/\W/g, '-')}`;

  // Status info
  const status = getStatusInfo(shop);
  const isOpen = status.status === 'open';
  const isClosed = status.status === 'closed' || status.status === 'permClosed' || status.status === 'tempClosed';

  // Rating
  const rating = placeDetails?.rating || 0;
  const ratingCount = placeDetails?.user_ratings_total || 0;
  const hasRating = rating > 0 && ratingCount > 0;

  // Photos
  const photos = placeDetails?.photos || [];
  const photoCount = photos.length;
  const hasPhotos = photoCount > 0;
  const primaryPhotoRef = hasPhotos ? photos[0].photo_reference : null;

  // Products
  const previewProducts = getPreviewProducts(shop, maxPreviewProducts);
  const totalProducts = countAvailableProducts(shop);
  const hasProducts = totalProducts > 0;

  // Contact
  const phone = shop.Phone?.trim() || null;
  const website = shop.Website?.trim() || null;
  const hasPhone = Boolean(phone);
  const hasWebsite = Boolean(website);

  // Location
  const lat = shop.lat ?? null;
  const lng = shop.lng ?? null;
  const hasLocation = lat !== null && lng !== null;

  // Address formatting
  const city = shop.City?.trim() || '';
  const address = shop.Address?.trim() || '';
  const fullAddress = [address, city, shop.State, shop.Zip].filter(Boolean).join(', ');

  // Distance (from ShopWithDistance)
  const distance = 'distanceText' in shop ? shop.distanceText : undefined;
  const distanceMeters = 'distance' in shop ? shop.distance : undefined;

  // Google Maps URL
  const googleMapsUrl = placeDetails?.url || null;

  // Featured review
  const featuredReview = getFeaturedReview(shop);

  return {
    id,
    name: shop.Name || 'Unknown Shop',
    slug: shop.slug || id,
    type: shop.type as LocationType,

    city,
    address,
    fullAddress,
    distance,
    distanceMeters,

    status,
    isOpen,
    isClosed,

    rating,
    ratingCount,
    hasRating,
    featuredReview,

    photos,
    photoCount,
    hasPhotos,
    primaryPhotoRef,

    previewProducts,
    totalProducts,
    hasProducts,

    phone,
    website,
    hasPhone,
    hasWebsite,

    lat,
    lng,
    hasLocation,

    googleMapsUrl,

    shop,
  };
}

/**
 * Transform multiple shops to card data
 */
export function transformShopsToCardData(
  shops: (Shop | ShopWithDistance)[],
  maxPreviewProducts?: number
): CardDisplayData[] {
  return shops.map(shop => transformShopToCardData(shop, maxPreviewProducts));
}

/**
 * Get display label for location type
 */
export function getLocationTypeLabel(type: LocationType): string {
  const labels: Record<LocationType, string> = {
    farm_stand: 'Farm Stand',
    cheese_shop: 'Cheese Shop',
    fish_monger: 'Fish Market',
    butcher: 'Butcher',
    antique_shop: 'Antiques',
    brewery: 'Brewery',
    winery: 'Winery',
    sugar_shack: 'Sugar Shack',
  };
  return labels[type] || 'Shop';
}

/**
 * Get emoji icon for location type
 */
export function getLocationTypeIcon(type: LocationType): string {
  const icons: Record<LocationType, string> = {
    farm_stand: '🌽',
    cheese_shop: '🧀',
    fish_monger: '🐟',
    butcher: '🥩',
    antique_shop: '🏺',
    brewery: '🍺',
    winery: '🍷',
    sugar_shack: '🍁',
  };
  return icons[type] || '📍';
}

/**
 * Get color classes for location type
 */
export function getLocationTypeColors(type: LocationType): {
  bg: string;
  text: string;
  gradient: string;
} {
  const colors: Record<LocationType, { bg: string; text: string; gradient: string }> = {
    farm_stand: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      gradient: 'from-green-400 to-emerald-600',
    },
    cheese_shop: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      gradient: 'from-amber-400 to-yellow-600',
    },
    fish_monger: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      gradient: 'from-blue-400 to-cyan-600',
    },
    butcher: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      gradient: 'from-red-400 to-rose-600',
    },
    antique_shop: {
      bg: 'bg-stone-100 dark:bg-stone-900/30',
      text: 'text-stone-700 dark:text-stone-400',
      gradient: 'from-amber-700 to-stone-600',
    },
    brewery: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      gradient: 'from-amber-500 to-orange-700',
    },
    winery: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      gradient: 'from-purple-400 to-rose-600',
    },
    sugar_shack: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      gradient: 'from-amber-600 to-amber-800',
    },
  };
  return colors[type] || colors.farm_stand;
}

/**
 * Format distance for display
 */
export function formatDistance(meters?: number): string {
  if (!meters) return '';

  const miles = meters / 1609.34;

  if (miles < 0.1) {
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft`;
  }

  if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  }

  return `${Math.round(miles)} mi`;
}

/**
 * Format rating for display (e.g., "4.5 (123)")
 */
export function formatRating(rating: number, count: number): string {
  if (!rating || !count) return '';
  return `${rating.toFixed(1)} (${count.toLocaleString()})`;
}

/**
 * Get rating star display data
 */
export function getRatingStars(rating: number): {
  fullStars: number;
  halfStar: boolean;
  emptyStars: number;
} {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return { fullStars, halfStar, emptyStars };
}
