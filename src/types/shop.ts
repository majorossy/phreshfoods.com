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

// Main Shop interface, combining sheet data and enriched Google data
export interface Shop {
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
  TwitterHandle?: string;
  FacebookPageID?: string;
  InstagramUsername?: string;
  InstagramRecentPostEmbedCode?: string;
  InstagramLink?: string;
  ImageOne?: string;
  ImageTwo?: string;
  ImageThree?: string;

  // Product booleans (keys should match PRODUCT_ICONS_CONFIG csvHeader values)
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
  lettus?: boolean; // As per your CSV header
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
  // Add any other product fields from your sheet if they become filterable

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