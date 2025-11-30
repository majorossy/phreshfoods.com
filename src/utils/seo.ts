// src/utils/seo.ts
// @ts-nocheck - Temporarily disabled for production build testing
import { Shop, PlaceOpeningHours } from '../types';
import { getDisplayName } from './typeUrlMappings';

// Schema.org opening hours specification
interface SchemaOpeningHoursSpec {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string;
  opens?: string;
  closes?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
  ogImageType?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  // Geo tags for local SEO
  geoRegion?: string;
  geoPlacename?: string;
  geoPosition?: { lat: number; lng: number };
  // Robots directive (for noindex on filter pages)
  robots?: string;
}

export interface FilteredPageSEOOptions {
  locationCount: number;
  searchLocation?: string;
  radius?: number;
  activeFilters?: string[];
  activeLocationTypes?: string[];
}

/**
 * Generate SEO meta tags for the homepage
 */
export function getHomepageSEO(): SEOConfig {
  const baseUrl = window.location.origin;
  // Canonical URL: current path without query parameters (filters, coordinates)
  // This ensures each route has a proper self-referencing canonical
  const canonicalUrl = `${baseUrl}${window.location.pathname}`;

  return {
    title: 'phind.us - Find Local Farms, Cheesemongers, Fishmongers & More',
    description: 'Discover fresh, local products from farm stands, cheesemongers, fishmongers, butchers, and antique shops across Maine. Search by location, filter by products, and support local businesses in your community.',
    keywords: 'farm stands, cheesemongers, fishmongers, butchers, antique shops, local produce, farmers market, fresh vegetables, Maine farms, local food, organic produce, artisan cheese, fresh seafood, local meat',
    ogTitle: 'phind.us - Support Local Maine Businesses',
    ogDescription: 'Find the freshest local products from farm stands, cheesemongers, fishmongers, and more near you. Search by location and discover what\'s available.',
    ogImage: `${baseUrl}/images/og-image.jpg`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'phind.us - Map showing local farm stands, cheesemongers, and fishmongers across Maine',
    ogUrl: canonicalUrl,
    twitterCard: 'summary_large_image',
    canonicalUrl: canonicalUrl,
    // Default geo tags for Maine (Portland as central point)
    geoRegion: 'US-ME',
    geoPlacename: 'Maine, United States',
    geoPosition: { lat: 43.6591, lng: -70.2568 },
  };
}

/**
 * Generate SEO meta tags for individual shop pages
 */
export function getShopSEO(shop: Shop): SEOConfig {
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
    if ((shop as Record<string, unknown>)[key]) products.push(name);
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

  // Build geo placename from city/state
  const geoPlacename = city && state ? `${city}, ${state}` : city || state || 'Maine, United States';

  return {
    title: `${farmName} - ${shopTypeDisplay} in ${city}${state ? `, ${state}` : ''}`,
    description,
    keywords,
    ogTitle: `${farmName} - Local ${shopTypeDisplay}`,
    ogDescription: description,
    ogImage: imageUrl,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: `${farmName} - ${shopTypeDisplay} located in ${city}${state ? `, ${state}` : ''}`,
    ogUrl: farmUrl,
    twitterCard: 'summary_large_image',
    canonicalUrl: farmUrl,
    // Shop-specific geo tags (uses shop coordinates if available)
    geoRegion: 'US-ME',
    geoPlacename,
    ...(shop.lat && shop.lng && {
      geoPosition: { lat: shop.lat, lng: shop.lng },
    }),
  };
}

/**
 * Generate dynamic SEO meta tags based on active filters
 * Creates contextual descriptions like "Found 12 farm stands near Portland, ME selling beef and eggs"
 */
export function getFilteredPageSEO(options: FilteredPageSEOOptions): SEOConfig {
  const baseUrl = window.location.origin;
  const { locationCount, searchLocation, radius, activeFilters = [], activeLocationTypes = [] } = options;

  // Build location type text
  const typeNames: Record<string, string> = {
    farm_stand: 'farm stands',
    cheese_shop: 'cheese shops',
    fish_monger: 'fish mongers',
    butcher: 'butchers',
    antique_shop: 'antique shops',
    brewery: 'breweries',
    winery: 'wineries',
    sugar_shack: 'sugar shacks',
  };

  const activeTypeNames = activeLocationTypes.map(t => typeNames[t] || t).filter(Boolean);
  const typeText = activeTypeNames.length > 0
    ? activeTypeNames.join(', ')
    : 'local businesses';

  // Build location text
  const locationText = searchLocation
    ? `near ${searchLocation}`
    : 'in Maine';

  // Build filter text
  const filterText = activeFilters.length > 0
    ? ` offering ${activeFilters.slice(0, 3).join(', ')}${activeFilters.length > 3 ? ' and more' : ''}`
    : '';

  // Build radius text
  const radiusText = radius ? ` within ${radius} miles` : '';

  // Dynamic title and description
  const title = `${locationCount} ${typeText} ${locationText} | phind.us`;
  const description = `Found ${locationCount} ${typeText} ${locationText}${radiusText}${filterText}. Browse local Maine businesses, view ratings, hours, and get directions.`;

  // Determine if this is a filtered view (should be noindex)
  const hasActiveFilters = activeFilters.length > 0 || (radius && radius !== 20);
  const robots = hasActiveFilters ? 'noindex, follow' : 'index, follow';

  return {
    title,
    description,
    keywords: [...activeTypeNames, ...activeFilters, 'Maine', 'local', searchLocation].filter(Boolean).join(', '),
    ogTitle: title,
    ogDescription: description,
    ogImage: `${baseUrl}/images/og-image.jpg`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: `Map showing ${locationCount} ${typeText} ${locationText}`,
    ogImageType: 'image/jpeg',
    ogUrl: `${baseUrl}${window.location.pathname}`,
    twitterCard: 'summary_large_image',
    canonicalUrl: `${baseUrl}${window.location.pathname}`, // Self-referencing canonical (path only, no query params)
    geoRegion: 'US-ME',
    geoPlacename: searchLocation || 'Maine, United States',
    geoPosition: { lat: 43.6591, lng: -70.2568 },
    robots,
  };
}

/**
 * Generate JSON-LD CollectionPage schema for listing pages
 * Tells search engines this is a collection of local businesses
 */
export function generateCollectionPageSchema(
  shops: Shop[],
  options?: { searchLocation?: string; activeLocationTypes?: string[] }
): string {
  const baseUrl = window.location.origin;
  const { searchLocation, activeLocationTypes = [] } = options || {};

  // Build collection name
  const typeNames: Record<string, string> = {
    farm_stand: 'Farm Stands',
    cheese_shop: 'Cheese Shops',
    fish_monger: 'Fish Mongers',
    butcher: 'Butchers',
    antique_shop: 'Antique Shops',
    brewery: 'Breweries',
    winery: 'Wineries',
    sugar_shack: 'Sugar Shacks',
  };

  const collectionName = activeLocationTypes.length === 1
    ? `${typeNames[activeLocationTypes[0]] || 'Local Businesses'} in Maine`
    : 'Local Businesses in Maine';

  const locationSuffix = searchLocation ? ` near ${searchLocation}` : '';

  // Create list items for up to 10 shops (Schema.org recommendation)
  const itemListElement = shops.slice(0, 10).map((shop, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'LocalBusiness',
      '@id': `${baseUrl}/farm/${shop.slug || shop.GoogleProfileID}`,
      name: shop.placeDetails?.name || shop.Name || 'Local Business',
      ...(shop.placeDetails?.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: shop.placeDetails.rating,
          ...(shop.placeDetails.user_ratings_total && {
            reviewCount: shop.placeDetails.user_ratings_total,
          }),
        },
      }),
    },
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${collectionName}${locationSuffix}`,
    description: `Browse ${shops.length} ${collectionName.toLowerCase()}${locationSuffix}. Find ratings, hours, directions, and contact information.`,
    url: baseUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: shops.length,
      itemListElement,
    },
  };

  return JSON.stringify(schema);
}

/**
 * Generate JSON-LD structured data for Organization (homepage)
 */
export function generateOrganizationSchema(): string {
  const baseUrl = window.location.origin;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'phind.us',
    alternateName: 'Phind US - Local Maine Business Finder',
    url: baseUrl,
    logo: `${baseUrl}/images/og-image.jpg`,
    description: 'Discover fresh, local products from farm stands, cheesemongers, fishmongers, butchers, and antique shops across Maine.',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'ME',
      addressCountry: 'US',
    },
    sameAs: [
      // Add social media URLs when available
    ],
    areaServed: {
      '@type': 'State',
      name: 'Maine',
    },
    serviceType: 'Local Business Directory',
  };

  return JSON.stringify(schema);
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
function generateOpeningHours(hours: PlaceOpeningHours | undefined): SchemaOpeningHoursSpec[] {
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
  setMetaTag('og:locale', 'en_US', 'property');
  setMetaTag('og:site_name', 'phind.us', 'property');
  if (config.ogUrl) {
    setMetaTag('og:url', config.ogUrl, 'property');
  }
  if (config.ogImage) {
    setMetaTag('og:image', config.ogImage, 'property');
    // Secure URL variant for HTTPS
    if (config.ogImage.startsWith('https://')) {
      setMetaTag('og:image:secure_url', config.ogImage, 'property');
    }
    // Enhanced OG image meta tags for better social sharing
    if (config.ogImageWidth) {
      setMetaTag('og:image:width', String(config.ogImageWidth), 'property');
    }
    if (config.ogImageHeight) {
      setMetaTag('og:image:height', String(config.ogImageHeight), 'property');
    }
    if (config.ogImageAlt) {
      setMetaTag('og:image:alt', config.ogImageAlt, 'property');
    }
    // Image type (defaults to jpeg for og-image.jpg)
    setMetaTag('og:image:type', config.ogImageType || 'image/jpeg', 'property');
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

  // Geo meta tags for local SEO
  if (config.geoRegion) {
    setMetaTag('geo.region', config.geoRegion);
  }
  if (config.geoPlacename) {
    setMetaTag('geo.placename', config.geoPlacename);
  }
  if (config.geoPosition) {
    const positionStr = `${config.geoPosition.lat};${config.geoPosition.lng}`;
    setMetaTag('geo.position', positionStr);
    setMetaTag('ICBM', `${config.geoPosition.lat}, ${config.geoPosition.lng}`);
  }

  // Robots directive (for noindex on filter pages)
  if (config.robots) {
    setMetaTag('robots', config.robots);
  }
}

/**
 * Generate JSON-LD Breadcrumb structured data for shop detail pages
 * Helps search engines understand site hierarchy and display breadcrumb trails in search results
 */
export function generateBreadcrumbSchema(shop: Shop): string {
  const baseUrl = window.location.origin;
  const shopName = shop.placeDetails?.name || shop.Name || 'Shop';
  const shopTypeDisplay = getDisplayName(shop.type);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: shopTypeDisplay,
        item: `${baseUrl}/${shop.type.replace('_', '-')}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: shopName,
        item: `${baseUrl}/farm/${shop.slug || shop.GoogleProfileID}`,
      },
    ],
  };

  return JSON.stringify(schema);
}

/**
 * Add JSON-LD structured data to page
 * Supports single schema or array of schemas (e.g., LocalBusiness + BreadcrumbList)
 */
export function addStructuredData(jsonLD: string | string[]): void {
  // Remove all existing structured data scripts
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
  existingScripts.forEach(script => script.remove());

  // Handle both single schema and array of schemas
  const schemas = Array.isArray(jsonLD) ? jsonLD : [jsonLD];

  // Add each schema as a separate script tag
  schemas.forEach(schema => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = schema;
    document.head.appendChild(script);
  });
}
