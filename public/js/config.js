// public/js/config.js
'use strict';

// --- App Configuration (Client-Side Only) ---
// Constants that are not secret and are used by the client UI

const markerColor = "#ed411a"; // Default color for shop markers

// --- Map Settings (Client-Side Only) ---
const DEFAULT_MAP_ZOOM = 10;
const USER_LOCATION_MAP_ZOOM = 10; // Zoom level when centering on user's location or specific POIs
const DEFAULT_MAP_CENTER = { lat: 43.6926, lng: -70.2537 }; // Approx. center of Biddeford, Maine
const USE_CUSTOM_MAP_STYLE = false; // Set to true to use maineLicensePlate, false for Google Maps default

const LAST_SEARCHED_LOCATION_KEY = 'farmStandFinder_lastSearchedLocation';
const LAST_SELECTED_RADIUS_KEY = 'farmStandFinder_lastSelectedRadius';

// Map Styles - (Keep your full maineLicensePlate style array here)
const mapStyles = {
  maineLicensePlate: [
    { elementType: "geometry", stylers: [{ color: "#ede5d3" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#4a3b2c" }, { weight: 2.5 }], },
    { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c0c0c0" }, { weight: 0.5 }], },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }, { visibility: "on" }], },
    { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#222222" }], },
    { featureType: "administrative.country", elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }, { weight: 3 }], },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }], },
    { featureType: "administrative.locality", elementType: "labels.text.stroke", stylers: [{ color: "#4a3b2c" }, { weight: 3.5 }], },
    { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }, { visibility: "on" }], },
    { featureType: "administrative.province", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }], },
    { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#288b5c" }], },
    { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#288b5c" }, { weight: 0.5 }], },
    { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#1a6a41" }], },
    { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] }, // Hide all POIs
    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#3c7346" }], visibility: "on" }, // Show parks explicitly
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }], visibility: "on"},
    { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#3c7346" }, { weight: 3 }], visibility: "on" },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#63493c" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#63493c" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 3 }], },
    { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#63493c" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#63493c" }] },
    { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#294873" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#294873" }, { weight: 3 }], },
  ],
};

// This was in uiLogic.js, but it's more of a global config for product data.
// It's used by uiLogic.js for display and potentially by main.js for filtering logic if not already handled.
const PRODUCT_ICONS_CONFIG = {
    // Meats
    'beef':       { csvHeader: 'beef',       name: 'Beef',       icon_available: 'beef_1.jpg',       icon_unavailable: 'beef_0.jpg',       category: 'Meats' },
    'pork':       { csvHeader: 'pork',       name: 'Pork',       icon_available: 'pork_1.jpg',       icon_unavailable: 'pork_0.jpg',       category: 'Meats' },
    'lamb':       { csvHeader: 'lamb',       name: 'Lamb',       icon_available: 'lamb_1.jpg',       icon_unavailable: 'lamb_0.jpg',       category: 'Meats' },
    // Poultry & Eggs
    'chicken':    { csvHeader: 'chicken',    name: 'Chicken',    icon_available: 'chicken_1.jpg',    icon_unavailable: 'chicken_0.jpg',    category: 'Poultry & Eggs' },
    'turkey':     { csvHeader: 'turkey',     name: 'Turkey',     icon_available: 'turkey_1.jpg',     icon_unavailable: 'turkey_0.jpg',     category: 'Poultry & Eggs' },
    'duck':       { csvHeader: 'duck',       name: 'Duck',       icon_available: 'duck_1.jpg',       icon_unavailable: 'duck_0.jpg',       category: 'Poultry & Eggs' },
    'eggs':       { csvHeader: 'eggs',       name: 'Eggs',       icon_available: 'eggs_1.jpg',       icon_unavailable: 'eggs_0.jpg',       category: 'Poultry & Eggs' },
    // Vegetables
    'corn':       { csvHeader: 'corn',       name: 'Corn',       icon_available: 'corn_1.jpg',       icon_unavailable: 'corn_0.jpg',       category: 'Vegetables' },
    'carrots':    { csvHeader: 'carrots',    name: 'Carrots',    icon_available: 'carrots_1.jpg',    icon_unavailable: 'carrots_0.jpg',    category: 'Vegetables' },
    'potatoes':   { csvHeader: 'potatoes',   name: 'Potatoes',   icon_available: 'potatoes_1.jpg',   icon_unavailable: 'potatoes_0.jpg',   category: 'Vegetables' },
    'lettus':     { csvHeader: 'lettus',     name: 'Lettuce',    icon_available: 'lettus_1.jpg',     icon_unavailable: 'lettus_0.jpg',     category: 'Vegetables' },
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
const FILTERABLE_PRODUCT_ATTRIBUTES = Object.keys(PRODUCT_ICONS_CONFIG);
const CATEGORY_DISPLAY_ORDER = ['Meats', 'Poultry & Eggs', 'Vegetables', 'Fruits', 'Aromatics']; // Define desired order