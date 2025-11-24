// src/config/map.ts
'use strict';

export const markerColor: string = "#ed411a"; // Default/legacy color

// Location type specific marker colors (Tailwind color-500 values for consistency)
export const MARKER_COLORS = {
  farm_stand: "#22c55e",    // Green-500 for farm stands
  cheese_shop: "#eab308",   // Yellow-500 for cheese shops
  fish_monger: "#3b82f6",   // Blue-500 for fish mongers
  butcher: "#ef4444",       // Red-500 for butchers
  antique_shop: "#6b7280",  // Gray-500 for antique shops
  brewery: "#d97706",       // Amber-600 for breweries (darker)
  winery: "#a855f7",        // Purple-500 for wineries
  sugar_shack: "#92400e",   // Amber-800 for sugar shacks (brown-orange)
  default: "#ed411a"        // Red fallback
};

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

// Portland, Maine coordinates (default map center)
export const DEFAULT_PORTLAND_CENTER: LatLngLiteral = { lat: 43.6591, lng: -70.2568 };
export const DEFAULT_MAP_CENTER: LatLngLiteral = DEFAULT_PORTLAND_CENTER;

export const DEFAULT_MAP_ZOOM: number = 11;
export const USER_LOCATION_MAP_ZOOM: number = 10;

export const USE_CUSTOM_MAP_STYLE: boolean = true;

// Google Maps API Key Security:
// - The Maps JavaScript API key is loaded via <script> tag in index.html
// - All geocoding, place details, and directions API calls go through backend proxy
// - Backend uses a separate, restricted API key (GOOGLE_API_KEY_BACKEND)
// - This approach minimizes exposure and allows better rate limiting/monitoring

// Google Maps Cloud-Based Styling (MAP_ID):
// - MAP_ID is currently DISABLED (commented out in MapComponent.tsx)
// - Using local custom styles (mapStyles.maineLicensePlate below) instead
// - To re-enable Cloud-based styling: Uncomment mapId line in MapComponent.tsx:161
// - Note: When MAP_ID is active, it overrides all local custom styles
export const MAP_ID: string = '6c1bbba6c5f48ca2beb388ad';

interface MapStyleElement {
  elementType?: string;
  featureType?: string;
  stylers: Array<{ [key: string]: any }>;
}

interface MapStyles {
  maineLicensePlate: MapStyleElement[];
}

// ✅ ACTIVE: These local map styles are currently being applied to the map!
// MAP_ID is disabled, so these styles control the map appearance.
// "Maine License Plate" Theme:
// - Inspired by Maine's state colors and natural landscape
// - Green tones for land, brown for roads, dark teal for water
// - Light text with dark strokes for high contrast and readability
//
// To change map styling (e.g., water color):
// → Simply edit the color values below and refresh your browser
export const mapStyles: MapStyles = {
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
    { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#3c7346" }], visibility: "on" },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }], visibility: "on"},
    { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#3c7346" }, { weight: 3 }], visibility: "on" },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#63493c" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#63493c" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 3 }], },
    { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#63493c" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#63493c" }] },
    { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
    // Water styling - Dark teal color (#356A78) for Maine coastal theme
    { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#356A78" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#356A78" }, { weight: 3 }], },
  ],
};

// Distance and Location Settings
export const DEFAULT_SEARCH_RADIUS_MILES: number = 25;
export const RADIUS_SLIDER_MIN_MILES: number = 5;
export const RADIUS_SLIDER_MAX_MILES: number = 100;
export const RADIUS_SLIDER_STEP_MILES: number = 5;
export const RADIUS_DEBOUNCE_MS: number = 300;           // Debounce for radius slider changes
export const METERS_PER_MILE: number = 1609.34;
export const MILES_PER_METER: number = 1 / 1609.34;

// Map Panning and Offset Settings
export const SELECTED_SHOP_PAN_OFFSET_X: number = 40; // Pixels to pan right when shop selected (moves marker left in view)
export const SELECTED_SHOP_PAN_OFFSET_Y: number = 20;  // Pixels to pan down when shop selected (frames info window)
export const AUTO_ZOOM_PADDING_PERCENT: number = 0.05;  // 5% padding around radius circle when auto-zooming
export const DESKTOP_BREAKPOINT_PX: number = 768;       // Min width to apply panel offset (tablet/desktop)
export const MAP_PAN_DELAY_MS: number = 100;            // Delay before applying offset after pan operation

// Marker Styling
export const MARKER_SIZE_PX: number = 20;              // Size of regular farm stand markers
export const MARKER_BORDER_WIDTH_PX: number = 0.67;    // Border width for markers
export const MARKER_TRANSITION_DURATION_S: string = '0.15s'; // Transition duration for marker animations
export const MARKER_DEFAULT_SCALE: string = 'scale(0.96)';   // Default marker scale (0.8 * 1.2 = 0.96)
export const MARKER_HOVER_SCALE: string = 'scale(1.28)';     // Hovered marker scale (1.07 * 1.2 ≈ 1.28)
export const MARKER_SELECTED_SCALE: string = 'scale(1.2)';   // Selected marker scale (1.0 * 1.2 = 1.2)
export const MARKER_DEFAULT_Z_INDEX_OFFSET: number = 1;      // Base z-index offset for markers
export const MARKER_SELECTED_Z_INDEX: number = 1001;         // Z-index for selected markers
export const MARKER_HOVER_Z_INDEX: number = 2000;            // Z-index for hovered markers
export const MARKER_HOVER_DEBOUNCE_MS: number = 50;          // Debounce time for marker hover events
export const MARKER_HOVER_COLOR: string = '#4285F4';         // Google blue for hover/selected state

// Search Location Marker Styling
export const SEARCH_MARKER_SIZE_PX: number = 34;             // Size of search location marker
export const SEARCH_MARKER_BORDER_WIDTH_PX: number = 1.5;    // Border width for search marker
export const SEARCH_MARKER_INNER_DOT_SIZE_PX: number = 6;    // Size of inner dot in search marker
export const SEARCH_MARKER_Z_INDEX: number = 9999;           // Z-index for search marker (always on top)
export const SEARCH_MARKER_COLOR: string = '#4285F4';        // Google blue for search marker

// Search Radius Circle Styling
export const RADIUS_CIRCLE_FILL_OPACITY: number = 0.1;       // Fill opacity for search radius circle
export const RADIUS_CIRCLE_STROKE_OPACITY: number = 0.4;     // Stroke opacity for search radius circle
export const RADIUS_CIRCLE_STROKE_WIDTH: number = 2;         // Stroke width for search radius circle
export const RADIUS_CIRCLE_Z_INDEX: number = 1;              // Z-index for radius circle (behind markers)
export const RADIUS_CIRCLE_COLOR: string = '#4285F4';        // Google blue for radius circle

// InfoWindow Settings
export const INFO_WINDOW_PIXEL_OFFSET_X: number = 0;         // Horizontal offset for InfoWindow
export const INFO_WINDOW_PIXEL_OFFSET_Y: number = -10;       // Vertical offset for InfoWindow (negative = up)

// Overlay Rendering Detection
export const OVERLAY_MIN_WIDTH_PX: number = 50;              // Minimum width to consider overlay fully rendered (filters out rendering artifacts)
export const OVERLAY_RENDER_WAIT_MS: number = 50;            // Maximum time to wait for overlays to render before falling back to ResizeObserver

// Debounce/Throttle Timings
export const PANEL_RESIZE_DEBOUNCE_MS: number = 100;         // Debounce for listings panel resize events
export const WINDOW_RESIZE_DEBOUNCE_MS: number = 300;        // Debounce for window resize events
