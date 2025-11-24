// src/utils/seo.ts
import { Shop } from '../types';
import { getDisplayName } from './typeUrlMappings';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
}

/**
 * Generate SEO meta tags for the homepage
 */
export function getHomepageSEO(): SEOConfig {
  const baseUrl = window.location.origin;

  return {
    title: 'PhreshFoods - Find Local Farms, Cheesemongers, Fishmongers & More',
    description: 'Discover fresh, local products from farm stands, cheesemongers, fishmongers, butchers, and antique shops across Maine. Search by location, filter by products, and support local businesses in your community.',
    keywords: 'farm stands, cheesemongers, fishmongers, butchers, antique shops, local produce, farmers market, fresh vegetables, Maine farms, local food, organic produce, artisan cheese, fresh seafood, local meat',
    ogTitle: 'PhreshFoods - Support Local Maine Businesses',
    ogDescription: 'Find the freshest local products from farm stands, cheesemongers, fishmongers, and more near you. Search by location and discover what\'s available.',
    ogImage: `${baseUrl}/images/og-image.jpg`,
    ogUrl: baseUrl,
    twitterCard: 'summary_large_image',
    canonicalUrl: baseUrl,
  };
}

/**
 * Generate SEO meta tags for individual shop pages
 */
export function getFarmStandSEO(shop: Shop): SEOConfig {
  const baseUrl = window.location.origin;
  const farmName = shop.placeDetails?.name || shop.Name || 'Shop';
  const address = shop.placeDetails?.formatted_address || shop.Address || '';
  const rating = shop.placeDetails?.rating || shop.Rating;

  // Extract city and state from address
  const addressParts = address.split(',').map(part => part.trim());
  const city = addressParts.length > 1 ? addressParts[addressParts.length - 2] : '';
  const state = addressParts.length > 0 ? addressParts[addressParts.length - 1] : '';

  // Build products list for description
  const products: string[] = [];
  const productMap = {
    beef: 'beef', pork: 'pork', lamb: 'lamb', chicken: 'chicken',
    eggs: 'eggs', corn: 'corn', carrots: 'carrots', potatoes: 'potatoes',
    tomatoes: 'tomatoes', lettuce: 'lettuce', strawberries: 'strawberries'
  };

  Object.entries(productMap).forEach(([key, name]) => {
    if ((shop as any)[key]) products.push(name);
  });

  const productsText = products.length > 0
    ? `Offering ${products.slice(0, 5).join(', ')}${products.length > 5 ? ' and more' : ''}.`
    : 'Fresh local produce available.';

  const ratingText = rating && rating !== 'N/A'
    ? ` Rated ${rating} stars.`
    : '';

  const description = `${farmName} in ${city}${state ? `, ${state}` : ''}. ${productsText}${ratingText} Find directions, hours, and contact information.`;

  // Get display name for shop type
  const shopTypeDisplay = getDisplayName(shop.type);

  const keywords = [
    farmName,
    shopTypeDisplay.toLowerCase(),
    city,
    state,
    'local produce',
    'fresh vegetables',
    ...products
  ].filter(Boolean).join(', ');

  const imageUrl = shop.ImageOne
    ? `${baseUrl}/images/${shop.ImageOne}`
    : `${baseUrl}/images/og-image.jpg`;

  const farmUrl = `${baseUrl}/farm/${shop.slug || shop.GoogleProfileID}`;

  return {
    title: `${farmName} - ${shopTypeDisplay} in ${city}${state ? `, ${state}` : ''}`,
    description,
    keywords,
    ogTitle: `${farmName} - Local ${shopTypeDisplay}`,
    ogDescription: description,
    ogImage: imageUrl,
    ogUrl: farmUrl,
    twitterCard: 'summary_large_image',
    canonicalUrl: farmUrl,
  };
}

/**
 * Generate JSON-LD structured data for LocalBusiness
 */
export function generateLocalBusinessSchema(shop: Shop): string {
  const baseUrl = window.location.origin;
  const farmName = shop.placeDetails?.name || shop.Name || 'Shop';
  const address = shop.placeDetails?.formatted_address || shop.Address || '';
  const rating = shop.placeDetails?.rating;
  const reviewCount = shop.placeDetails?.user_ratings_total;
  const shopTypeDisplay = getDisplayName(shop.type).toLowerCase();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/farm/${shop.slug || shop.GoogleProfileID}`,
    name: farmName,
    description: `Local ${shopTypeDisplay} offering fresh products${address ? ` in ${address}` : ''}`,
    url: `${baseUrl}/farm/${shop.slug || shop.GoogleProfileID}`,
    ...(shop.ImageOne && {
      image: `${baseUrl}/images/${shop.ImageOne}`,
    }),
    ...(shop.lat && shop.lng && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: shop.lat,
        longitude: shop.lng,
      },
    }),
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: address,
      },
    }),
    ...(shop.Phone && {
      telephone: shop.Phone,
    }),
    ...(rating && rating !== 'N/A' && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        ...(reviewCount && { reviewCount }),
      },
    }),
    ...(shop.placeDetails?.opening_hours && {
      openingHoursSpecification: generateOpeningHours(shop.placeDetails.opening_hours),
    }),
  };

  return JSON.stringify(schema);
}

/**
 * Helper to generate opening hours in Schema.org format
 */
function generateOpeningHours(hours: any): any[] {
  if (!hours?.weekday_text) return [];

  const dayMap: { [key: string]: string } = {
    Monday: 'Monday',
    Tuesday: 'Tuesday',
    Wednesday: 'Wednesday',
    Thursday: 'Thursday',
    Friday: 'Friday',
    Saturday: 'Saturday',
    Sunday: 'Sunday',
  };

  return hours.weekday_text.map((text: string) => {
    const [day, times] = text.split(': ');
    const dayOfWeek = dayMap[day];

    if (!dayOfWeek || times === 'Closed') return null;

    // Parse times like "9:00 AM – 5:00 PM"
    const timeParts = times.split('–').map((t: string) => t.trim());

    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek,
      opens: convertTo24Hour(timeParts[0]),
      closes: convertTo24Hour(timeParts[1]),
    };
  }).filter(Boolean);
}

/**
 * Convert 12-hour time to 24-hour format
 */
function convertTo24Hour(time: string): string {
  if (!time) return '00:00';

  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return time;

  let [, hours, minutes, period] = match;
  let hour = parseInt(hours);

  if (period.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Update document head with meta tags
 */
export function updateMetaTags(config: SEOConfig): void {
  // Update title
  document.title = config.title;

  // Helper to set or update meta tag
  const setMetaTag = (selector: string, content: string, attribute: string = 'name') => {
    let element = document.querySelector(`meta[${attribute}="${selector}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, selector);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Basic meta tags
  setMetaTag('description', config.description);
  if (config.keywords) {
    setMetaTag('keywords', config.keywords);
  }

  // Open Graph tags
  setMetaTag('og:title', config.ogTitle || config.title, 'property');
  setMetaTag('og:description', config.ogDescription || config.description, 'property');
  setMetaTag('og:type', 'website', 'property');
  if (config.ogUrl) {
    setMetaTag('og:url', config.ogUrl, 'property');
  }
  if (config.ogImage) {
    setMetaTag('og:image', config.ogImage, 'property');
  }

  // Twitter Card tags
  setMetaTag('twitter:card', config.twitterCard || 'summary');
  setMetaTag('twitter:title', config.ogTitle || config.title);
  setMetaTag('twitter:description', config.ogDescription || config.description);
  if (config.ogImage) {
    setMetaTag('twitter:image', config.ogImage);
  }

  // Canonical URL
  if (config.canonicalUrl) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = config.canonicalUrl;
  }
}

/**
 * Add JSON-LD structured data to page
 */
export function addStructuredData(jsonLD: string): void {
  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) {
    existing.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = jsonLD;
  document.head.appendChild(script);
}
