// js/config.js

// --- Social API Config ---
const FACEBOOK_APP_ACCESS_TOKEN = "PASTE_YOUR_APP_ACCESS_TOKEN_HERE"; // Replace! IMPORTANT!
const FACEBOOK_API_VERSION = "v19.0";
const POST_LIMIT = 3;

// --- App Configuration ---
const URL_NOT_CONFIGURED_PLACEHOLDER =
  "YOUR_GOOGLE_SHEET_PUBLISHED_CSV_URL_HERE";
const GOOGLE_SHEET_DIRECT_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSoWds2ab32jpobSg0c8Shqdo9cSv_hz7j9J9_GLAapRR0kI4tSZiKuK2yHgBBQOl_jB3zj63PokE54/pub?output=csv";
const PROXY_URL = "https://api.allorigins.win/raw?url="; // Optional proxy
const DATA_FETCH_URL = PROXY_URL
  ? PROXY_URL + encodeURIComponent(GOOGLE_SHEET_DIRECT_URL)
  : GOOGLE_SHEET_DIRECT_URL;

const markerColor = "#ed411a"; // red orange for shop markers

const DEFAULT_MAP_ZOOM = 10;
const USER_LOCATION_MAP_ZOOM = 14;
const DEFAULT_MAP_CENTER = { lat: 43.6926, lng: -70.2537 }; // Biddeford center
const DEFAULT_ZOOM = 14; // You might want this too
const USER_LOCATION_ZOOM = 14; // Changed name for clarity

const mapStyles = {
  maineLicensePlate: [
    { elementType: "geometry", stylers: [{ color: "#ede5d3" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }] },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#4a3b2c" }, { weight: 2.5 }],
    },
    {
      featureType: "landscape.man_made",
      elementType: "geometry.fill",
      stylers: [{ color: "#288b5c" }],
    },
    {
      featureType: "landscape.man_made",
      elementType: "geometry.stroke",
      stylers: [{ color: "#288b5c" }, { weight: 0.5 }],
    }, // Corrected from your HTML, was d8cbae
    {
      featureType: "landscape.natural",
      elementType: "geometry.fill",
      stylers: [{ color: "#1a6a41" }],
    }, // Corrected from your HTML, was a1b59c
    {
      featureType: "water",
      elementType: "geometry.fill",
      stylers: [{ color: "#294873" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#F0F0F0" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#294873" }, { weight: 3 }],
    },
    {
      featureType: "road",
      elementType: "geometry.fill",
      stylers: [{ color: "#63493c" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#63493c" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#ffffff" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#000000" }, { weight: 3 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [{ color: "#63493c" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#63493c" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry.fill",
      stylers: [{ color: "#3c7346" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#F0F0F0" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#3c7346" }, { weight: 3 }],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#294873" }, { weight: 0.75 }],
    },
    {
      featureType: "administrative.country",
      elementType: "labels.text.fill",
      stylers: [{ color: "#F0F0F0" }],
    },
    {
      featureType: "administrative.province",
      elementType: "labels.text.fill",
      stylers: [{ color: "#F0F0F0" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#F0F0F0" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#4a3b2c" }, { weight: 3.5 }],
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    // --- STYLES FOR ADMINISTRATIVE BOUNDARIES ---

    // Base style for general administrative lines (can be subtle)
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [
        { color: "#c0c0c0" }, // A light grey for less important admin lines
        { weight: 0.5 },
      ],
    },
    // Optional: Style for state/province lines (if you want them different from country)
    {
      featureType: "administrative.province",
      elementType: "geometry.stroke",
      stylers: [
        { color: "#ffffff" }, // Yellow for state lines (as per previous request)
        { weight: 3 }, // Or adjust if you want them less prominent than country
        { visibility: "on" },
      ],
    },

    // --- HIGHLIGHT COUNTRY BORDERS (USA-Canada) ---
    {
      featureType: "administrative.country",
      elementType: "geometry.stroke", // Target the border line
      stylers: [
        { color: "#ffffff" }, // Dark Red (example, choose a color that stands out)
        // Or a prominent dark grey like "#505050"
        { weight: 3 }, // Make it reasonably thick
        { visibility: "on" }, // Ensure it's visible
      ],
    },
    // Optional: Style for country labels, if needed
    {
      featureType: "administrative.country",
      elementType: "labels.text.fill",
      stylers: [{ color: "#222222" }], // Dark color for country names
    },
    {
      featureType: "administrative.country",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#FFFFFF" }, { weight: 3 }], // White halo for readability
    },
  ],
};
