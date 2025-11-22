// src/types/shop.ts

export interface GeoLocation {
  lat: number;
  lng: number;
}

// Based on Google Place Details relevant fields and what you might pre-fetch
export interface PlaceOpeningHoursPeriodDetail {
  day: number; // 0-6, Sunday-Saturday
  time: string; // "HHMM"
}

export interface PlaceOpeningHoursPeriod {
  open: PlaceOpeningHoursPeriodDetail;
  close?: PlaceOpeningHoursPeriodDetail; // May be missing if open 24 hours and only 'open' is present
}

export interface PlaceOpeningHours {
  open_now?: boolean;
  periods?: PlaceOpeningHoursPeriod[];
  weekday_text?: string[]; // e.g., ["Monday: 9:00 AM – 5:00 PM", ...]
}

export interface PlacePhoto {
  height: number;
  html_attributions: string[];
  photo_reference: string;
  width: number;
}

export interface PlaceReview {
  author_name: string;
  author_url?: string;
  language?: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text?: string;
  time: number; // Unix timestamp
}

export interface PlaceDetails {
  // Key details you'll likely use or pre-fetch
  place_id?: string; // Should always be there if fetched by ID
  name?: string;
  formatted_address?: string;
  geometry?: {
    location: GeoLocation;
    viewport?: {
      northeast: GeoLocation;
      southwest: GeoLocation;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  url?: string; // Google Maps URL for the place
  business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | string; // string for other possible values
  opening_hours?: PlaceOpeningHours;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  // You can add more fields from Google Place Details as needed
  // e.g., international_phone_number, adr_address, types, etc.
}

// Location type discriminator
export type LocationType = 'farm_stand' | 'cheese_shop' | 'fish_monger' | 'butcher' | 'antique_shop';

// Base interface with common fields shared by all location types
export interface BaseLocation {
  // Type discriminator
  type: LocationType;
  // Optional types array for locations that are both farm stand and cheese shop
  types?: LocationType[];

  // Fields primarily from your Google Sheet
  Name: string; // Should always be present
  Address: string; // Should always be present
  City?: string;
  Zip?: string;
  Rating: string | number; // From sheet it's string "N/A" or number, after enrichment it might be number
  Phone?: string;
  Website?: string; // Original from sheet
  GoogleProfileID?: string;
  slug: string; // From sheet or generated
  XHandle?: string;
  FacebookPageID?: string;
  InstagramUsername?: string;
  InstagramRecentPostEmbedCode?: string;
  InstagramLink?: string;
  ImageOne?: string;
  ImageTwo?: string;
  ImageThree?: string;

  // Fields derived or enriched, especially after geocoding/Place Details API calls
  lat: number | null; // Can be null if geocoding fails
  lng: number | null; // Can be null if geocoding fails
  lat_from_sheet?: number | string | null; // Original value if you keep it
  lng_from_sheet?: number | string | null; // Original value if you keep it

  // Enriched data from Google Places API (can be partial or full)
  placeDetails?: PlaceDetails;

  // Client-side properties (optional, for UI state if not handled by React state directly)
  distance?: number; // Calculated distance from search center
  // marker?: any; // For Google Maps marker instance - typically managed by Map component's state/refs now
}

// Farm stand specific products
export interface FarmStandProducts {
  beef?: boolean;
  pork?: boolean;
  lamb?: boolean;
  chicken?: boolean;
  turkey?: boolean;
  duck?: boolean;
  eggs?: boolean;
  corn?: boolean;
  carrots?: boolean;
  potatoes?: boolean;
  lettuce?: boolean;
  spinach?: boolean;
  squash?: boolean;
  tomatoes?: boolean;
  peppers?: boolean;
  cucumbers?: boolean;
  zucchini?: boolean;
  garlic?: boolean;
  onions?: boolean;
  strawberries?: boolean;
  blueberries?: boolean;
}

// Cheese shop specific products
export interface CheeseShopProducts {
  // Cheese types
  cheddar?: boolean;
  brie?: boolean;
  gouda?: boolean;
  mozzarella?: boolean;
  feta?: boolean;
  blue_cheese?: boolean;
  parmesan?: boolean;
  swiss?: boolean;
  provolone?: boolean;

  // Milk sources
  cow_milk?: boolean;
  goat_milk?: boolean;
  sheep_milk?: boolean;
}

// Farm stand location type
export interface FarmStand extends BaseLocation {
  type: 'farm_stand';
  products: FarmStandProducts;
}

// Cheese shop location type
export interface CheeseShop extends BaseLocation {
  type: 'cheese_shop';
  products: CheeseShopProducts;
}

// Main Shop type as discriminated union
export type Shop = FarmStand | CheeseShop;

// Type guards for runtime checking
export function isFarmStand(shop: Shop): shop is FarmStand {
  return shop.type === 'farm_stand';
}

export function isCheeseShop(shop: Shop): shop is CheeseShop {
  return shop.type === 'cheese_shop';
}

export interface ShopWithDistance extends Shop {
  distance?: number; // Distance in meters (optional, for sorting)
  distanceText?: string; // Formatted distance string for display (e.g., "2.3 mi away")
}