// src/config/appConfig.ts
'use strict';

// --- App Configuration (Client-Side Only) ---
// Constants that are not secret and are used by the client UI

export const markerColor: string = "#ed411a"; // Default color for shop markers

export interface BoundsLiteral {
  north: number;
  south: number;
  west: number;
  east: number;
}

export const MAINE_BOUNDS_LITERAL: BoundsLiteral = {
  north: 47.459683,
  south: 42.975426,
  west: -71.089859,
  east: -66.949829
};

export interface LatLngLiteral {
  lat: number;
  lng: number;
}


export const DEFAULT_MAP_CENTER: LatLngLiteral = { lat: 43.6591, lng: -70.2568 }; // Example: Portland, ME
export const DEFAULT_PORTLAND_CENTER: LatLngLiteral = { lat: 43.6591, lng: -70.2568 };

// --- Map Settings (Client-Side Only) ---
export const DEFAULT_MAP_ZOOM: number = 11; // Default zoom level for the map
export const USER_LOCATION_MAP_ZOOM: number = 11; // Zoom level when centering on user's location or specific POIs

export const USE_CUSTOM_MAP_STYLE: boolean = false; // Set to true to use maineLicensePlate, false for Google Maps default
// If true, ensure mapStyles.maineLicensePlate is correctly defined below or imported

// --- Local Storage and Cookie Keys ---
export const LAST_SEARCHED_LOCATION_KEY: string = 'farmStandFinder_lastSearchedLocation';
export const LAST_SELECTED_RADIUS_KEY: string = 'farmStandFinder_lastSelectedRadius';

// This one is important for remembering the gmp-place-autocomplete selection object
export const LAST_SEARCHED_LOCATION_COOKIE_NAME: string = 'farmStandFinder_lastLocation';
export const COOKIE_EXPIRY_DAYS: number = 30; // Cookie will last for 30 days

export const GOOGLE_MAPS_API_KEY: string = 'AIzaSyAeu_BXDUXVVut_mW4n-WFqR0lnwlY0VLs';
// --- Google Maps Specific ---
export const MAP_ID: string = '6c1bbba6c5f48ca2beb388ad'; // Your Google Maps Map ID

// Map Styles - (Keep your full maineLicensePlate style array here)
// You can define the type for a MapStyleElement if you want more type safety
interface MapStyleElement {
  elementType?: string;
  featureType?: string;
  stylers: Array<{ [key: string]: any }>; // More specific types can be added for stylers
}

interface MapStyles {
  maineLicensePlate: MapStyleElement[];
  // You could add other style definitions here
}

export const mapStyles: MapStyles = {
  maineLicensePlate: [
    { elementType: "geometry", stylers: [{ color: "#ede5d3" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }] }, // Changed from #63493c for better contrast on ede5d3
    { elementType: "labels.text.stroke", stylers: [{ color: "#4a3b2c" }, { weight: 2.5 }], }, // Added stroke for readability
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c0c0c0" }, { weight: 0.5 }], },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }, { visibility: "on" }], },
    { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#222222" }], },
    { featureType: "administrative.country", elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 3 }], },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }], }, // Changed for contrast
    { featureType: "administrative.locality", elementType: "labels.text.stroke", stylers: [{ color: "#4a3b2c" }, { weight: 3.5 }], },
    { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }, { visibility: "on" }], },
    { featureType: "administrative.province", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }], }, // Changed for contrast
    { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#288b5c" }], }, // Pine tree green
    { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#288b5c" }, { weight: 0.5 }], },
    { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#1a6a41" }], }, // Darker pine green
    { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] }, // Hide all POIs by default
    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#3c7346" }], visibility: "on" }, // Explicitly show parks
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }], visibility: "on"}, // Changed for contrast
    { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#3c7346" }, { weight: 3 }], visibility: "on" },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#63493c" }] }, // Road color from plate (dark brown/red)
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#63493c" }] }, // Road stroke
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] }, // White text for roads
    { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 3 }], }, // Black stroke for road text
    { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#63493c" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#63493c" }] },
    { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] }, // Hide transit
    { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#294873" }] }, // Water color from plate (dark blue)
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }] }, // Changed for contrast
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#294873" }, { weight: 3 }], },
  ],
};

// Product Icons Configuration
export interface ProductConfig {
  csvHeader: string;
  name: string;
  icon_available: string;
  icon_unavailable: string;
  category: string;
}

export interface ProductIconsConfig {
  [key: string]: ProductConfig;
}

export const PRODUCT_ICONS_CONFIG: ProductIconsConfig = {
  // Meats
  'beef':       { csvHeader: 'beef',       name: 'Beef',       icon_available: 'beef_1.jpg',       icon_unavailable: 'beef_0.jpg',       category: 'Meats' },
  'pork':       { csvHeader: 'pork',       name: 'Pork',       icon_available: 'pork_1.jpg',       icon_unavailable: 'pork_0.jpg',       category: 'Meats' },
  'lamb':       { csvHeader: 'lamb',       name: 'Lamb',       icon_available: 'lamb_1.jpg',       icon_unavailable: 'lamb_0.jpg',       category: 'Meats' },
  // Poultry & Eggs
  'chicken':    { csvHeader: 'chicken',    name: 'Chicken',    icon_available: 'chicken_1.jpg',    icon_unavailable: 'chicken_0.jpg',    category: 'Poultry & Eggs' },
  'turkey':     { csvHeader: 'turkey',     name: 'Turkey',     icon_available: 'turkey_1.jpg',     icon_unavailable: 'turkey_0.jpg',    category: 'Poultry & Eggs' },
  'duck':       { csvHeader: 'duck',       name: 'Duck',       icon_available: 'duck_1.jpg',       icon_unavailable: 'duck_0.jpg',       category: 'Poultry & Eggs' },
  'eggs':       { csvHeader: 'eggs',       name: 'Eggs',       icon_available: 'eggs_1.jpg',       icon_unavailable: 'eggs_0.jpg',       category: 'Poultry & Eggs' },
  // Vegetables
  'corn':       { csvHeader: 'corn',       name: 'Corn',       icon_available: 'corn_1.jpg',       icon_unavailable: 'corn_0.jpg',       category: 'Vegetables' },
  'carrots':    { csvHeader: 'carrots',    name: 'Carrots',    icon_available: 'carrots_1.jpg',    icon_unavailable: 'carrots_0.jpg',    category: 'Vegetables' },
  'potatoes':   { csvHeader: 'potatoes',   name: 'Potatoes',   icon_available: 'potatoes_1.jpg',   icon_unavailable: 'potatoes_0.jpg',   category: 'Vegetables' },
  'lettus':     { csvHeader: 'lettus',     name: 'Lettuce',    icon_available: 'lettus_1.jpg',     icon_unavailable: 'lettus_0.jpg',     category: 'Vegetables' }, // Note: 'lettus' matches your original CSV header
  'spinach':    { csvHeader: 'spinach',    name: 'Spinach',    icon_available: 'spinach_1.jpg',    icon_unavailable: 'spinach_0.jpg',    category: 'Vegetables' },
  'squash':     { csvHeader: 'squash',     name: 'Squash',     icon_available: 'squash_1.jpg',     icon_unavailable: 'squash_0.jpg',     category: 'Vegetables' },
  'tomatoes':   { csvHeader: 'tomatoes',   name: 'Tomatoes',   icon_available: 'tomatoes_1.jpg',   icon_unavailable: 'tomatoes_0.jpg',   category: 'Vegetables' },
  'peppers':    { csvHeader: 'peppers',    name: 'Peppers',    icon_available: 'peppers_1.jpg',    icon_unavailable: 'peppers_0.jpg',    category: 'Vegetables' },
  'cucumbers':  { csvHeader: 'cucumbers',  name: 'Cucumbers',  icon_available: 'cucumbers_1.jpg',  icon_unavailable: 'cucumbers_0.jpg',  category: 'Vegetables' },
  'zucchini':   { csvHeader: 'zucchini',   name: 'Zucchini',   icon_available: 'zucchini_1.jpg',   icon_unavailable: 'zucchini_0.jpg',   category: 'Vegetables' },
  // Aromatics
  'garlic':     { csvHeader: 'garlic',     name: 'Garlic',     icon_available: 'garlic_1.jpg',     icon_unavailable: 'garlic_0.jpg',     category: 'Aromatics' },
  'onions':     { csvHeader: 'onions',     name: 'Onions',     icon_available: 'onions_1.jpg',     icon_unavailable: 'onions_0.jpg',     category: 'Aromatics' },
  // Fruits
  'strawberries': { csvHeader: 'strawberries', name: 'Strawberries', icon_available: 'strawberries_1.jpg', icon_unavailable: 'strawberries_0.jpg', category: 'Fruits' },
  'blueberries':  { csvHeader: 'blueberries',  name: 'Blueberries',  icon_available: 'blueberries_1.jpg',  icon_unavailable: 'blueberries_0.jpg',  category: 'Fruits' },
};

// Derived configurations from PRODUCT_ICONS_CONFIG
// Explicitly type this if you want to ensure all keys from PRODUCT_ICONS_CONFIG are present,
// or keep it as string[] if it's just a list of the keys.
export const FILTERABLE_PRODUCT_ATTRIBUTES: string[] = Object.keys(PRODUCT_ICONS_CONFIG);

export const CATEGORY_DISPLAY_ORDER: string[] = ['Meats', 'Poultry & Eggs', 'Vegetables', 'Fruits', 'Aromatics']; // Define desired order
