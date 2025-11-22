// src/config/map.ts
'use strict';

export const markerColor: string = "#ed411a";

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

export const USE_CUSTOM_MAP_STYLE: boolean = false;

// Google Maps API Key Security:
// - The Maps JavaScript API key is loaded via <script> tag in index.html
// - All geocoding, place details, and directions API calls go through backend proxy
// - Backend uses a separate, restricted API key (GOOGLE_API_KEY_BACKEND)
// - This approach minimizes exposure and allows better rate limiting/monitoring

export const MAP_ID: string = '6c1bbba6c5f48ca2beb388ad';

interface MapStyleElement {
  elementType?: string;
  featureType?: string;
  stylers: Array<{ [key: string]: any }>;
}

interface MapStyles {
  maineLicensePlate: MapStyleElement[];
}

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
    { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#294873" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#F0F0F0" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#294873" }, { weight: 3 }], },
  ],
};

// Distance and Location Settings
export const DEFAULT_SEARCH_RADIUS_MILES: number = 20;
export const METERS_PER_MILE: number = 1609.34;
export const MILES_PER_METER: number = 1 / 1609.34;

// Map Panning and Offset Settings
export const SELECTED_SHOP_PAN_OFFSET_X: number = 40; // Pixels to pan right when shop selected (moves marker left in view)
export const SELECTED_SHOP_PAN_OFFSET_Y: number = 20;  // Pixels to pan down when shop selected (frames info window)
export const AUTO_ZOOM_PADDING_PERCENT: number = 0.1;  // 10% padding around radius circle when auto-zooming
export const DESKTOP_BREAKPOINT_PX: number = 768;       // Min width to apply panel offset (tablet/desktop)
export const MAP_PAN_DELAY_MS: number = 100;            // Delay before applying offset after pan operation
