'use strict';

// --- App Configuration ---
const URL_NOT_CONFIGURED_PLACEHOLDER = "YOUR_GOOGLE_SHEET_PUBLISHED_CSV_URL_HERE";
// IMPORTANT: Replace with your actual published Google Sheet CSV URL
const GOOGLE_SHEET_DIRECT_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlW0lYZ-sW70lJ_eK6IgmD0INk187Aee_R1l3V5TID_vVDSmbpJr3bSofzCAvIGj3FcDETus9ndhkx/pub?output=csv";

const PROXY_URL = "https://api.allorigins.win/raw?url="; // Optional proxy for CORS issues if any
const DATA_FETCH_URL = PROXY_URL
  ? PROXY_URL + encodeURIComponent(GOOGLE_SHEET_DIRECT_URL)
  : GOOGLE_SHEET_DIRECT_URL;

const markerColor = "#ed411a"; // Default color for shop markers

// --- Map Settings ---
const DEFAULT_MAP_ZOOM = 10;     // Default zoom for general areas (cities, specific addresses after search)
const USER_LOCATION_MAP_ZOOM = 14; // Zoom level when centering on user's location (if implemented) or more specific POIs
const DEFAULT_MAP_CENTER = { lat: 43.6926, lng: -70.2537 }; // Approx. center of Biddeford, Maine

// NEW FLAG FOR CUSTOM MAP STYLE
const USE_CUSTOM_MAP_STYLE = false; // Set to true to use maineLicensePlate, false for Google Maps default


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

// --- Other Application Constants (if any) ---
// Example: const MAX_IMAGE_GALLERY_ITEMS = 9;