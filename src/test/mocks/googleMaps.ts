// src/test/mocks/googleMaps.ts
// Mock implementation of Google Maps API for testing

import { vi } from 'vitest';

/**
 * WHAT IS THIS FILE?
 * ------------------
 * This file creates a fake version of the Google Maps API that we can use in tests.
 * The real Google Maps API requires an API key and makes network requests.
 * In tests, we don't want to:
 * - Make real network requests (slow, unreliable)
 * - Require API keys (security risk in CI)
 * - Load the actual Maps JavaScript library (slow)
 *
 * WHY DO WE NEED IT?
 * ------------------
 * Components like MapComponent and Header use google.maps.* APIs
 * Without this mock, tests would fail with "google is not defined"
 *
 * HOW TO USE IT IN TESTS:
 * -----------------------
 * import { mockGoogleMaps } from '../test/mocks/googleMaps';
 *
 * beforeEach(() => {
 *   mockGoogleMaps(); // Sets up the mock before each test
 * });
 */

/**
 * Mock LatLng class - Represents a geographic coordinate
 */
class MockLatLng {
  private _lat: number;
  private _lng: number;

  constructor(lat: number, lng: number) {
    this._lat = lat;
    this._lng = lng;
  }

  lat() {
    return this._lat;
  }

  lng() {
    return this._lng;
  }

  toJSON() {
    return { lat: this._lat, lng: this._lng };
  }
}

/**
 * Mock LatLngBounds class - Represents a rectangular geographic area
 */
class MockLatLngBounds {
  private sw: MockLatLng;
  private ne: MockLatLng;

  constructor(sw?: { lat: number; lng: number }, ne?: { lat: number; lng: number }) {
    this.sw = sw ? new MockLatLng(sw.lat, sw.lng) : new MockLatLng(0, 0);
    this.ne = ne ? new MockLatLng(ne.lat, ne.lng) : new MockLatLng(0, 0);
  }

  getSouthWest() {
    return this.sw;
  }

  getNorthEast() {
    return this.ne;
  }

  toJSON() {
    return {
      south: this.sw.lat(),
      west: this.sw.lng(),
      north: this.ne.lat(),
      east: this.ne.lng(),
    };
  }
}

/**
 * Mock Map class - Represents the Google Maps map instance
 */
class MockMap {
  center: MockLatLng;
  zoom: number;
  listeners: Record<string, Function[]>;

  constructor(_element: HTMLElement, options: any) {
    this.center = options.center || new MockLatLng(43.6591, -70.2568);
    this.zoom = options.zoom || 10;
    this.listeners = {};
  }

  getCenter() {
    return this.center;
  }

  setCenter(center: MockLatLng) {
    this.center = center;
  }

  getZoom() {
    return this.zoom;
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
  }

  panTo(center: MockLatLng) {
    this.center = center;
  }

  fitBounds(_bounds: MockLatLngBounds) {
    // In a real implementation, this would calculate the appropriate zoom/center
    // For testing, we just acknowledge it was called
  }

  addListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return {
      remove: () => {
        this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
      },
    };
  }
}

/**
 * Mock AdvancedMarkerElement - Represents a marker on the map
 */
class MockAdvancedMarkerElement {
  position: MockLatLng | null;
  map: MockMap | null;
  content: HTMLElement | null;
  title: string;
  zIndex: number;
  private listeners: Record<string, Function[]>;

  constructor(options: any) {
    this.position = options.position || null;
    this.map = options.map || null;
    this.content = options.content || null;
    this.title = options.title || '';
    this.zIndex = options.zIndex || 0;
    this.listeners = {};
  }

  addListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Simulate click for testing
  _triggerEvent(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
    }
  }
}

/**
 * Mock InfoWindow - Represents the popup window on markers
 */
class MockInfoWindow {
  content: string | HTMLElement | null;
  private map: MockMap | null;
  private anchor: MockAdvancedMarkerElement | null;

  constructor(options: any = {}) {
    this.content = null;
    this.map = null;
    this.anchor = null;
  }

  setContent(content: string | HTMLElement) {
    this.content = content;
  }

  getContent() {
    return this.content;
  }

  open(options: any) {
    this.map = options.map;
    this.anchor = options.anchor;
  }

  close() {
    this.map = null;
    this.anchor = null;
  }

  getMap() {
    return this.map;
  }

  getAnchor() {
    return this.anchor;
  }
}

/**
 * Mock Circle - Represents a circular overlay on the map (radius circle)
 */
class MockCircle {
  private _center: MockLatLng;
  private _radius: number;
  private _map: MockMap | null;

  constructor(options: any) {
    this._center = options.center || new MockLatLng(0, 0);
    this._radius = options.radius || 0;
    this._map = options.map || null;
  }

  getCenter() {
    return this._center;
  }

  setCenter(center: MockLatLng) {
    this._center = center;
  }

  getRadius() {
    return this._radius;
  }

  setRadius(radius: number) {
    this._radius = radius;
  }

  getBounds() {
    // Simple approximation: create bounds around circle
    // Real implementation uses spherical geometry
    const latOffset = this._radius / 111000; // Rough meters to degrees conversion
    const lngOffset = this._radius / 111000;

    return new MockLatLngBounds(
      { lat: this._center.lat() - latOffset, lng: this._center.lng() - lngOffset },
      { lat: this._center.lat() + latOffset, lng: this._center.lng() + lngOffset }
    );
  }

  setMap(map: MockMap | null) {
    this._map = map;
  }
}

/**
 * Mock Autocomplete - For place search autocomplete
 */
class MockAutocomplete {
  private input: HTMLInputElement;
  private listeners: Record<string, Function[]>;
  private mockPlace: any;

  constructor(input: HTMLInputElement, _options: any) {
    this.input = input;
    this.listeners = {};
    this.mockPlace = null;
  }

  addListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  getPlace() {
    return this.mockPlace || {
      geometry: {
        location: new MockLatLng(43.6591, -70.2568),
      },
      formatted_address: 'Portland, ME, USA',
    };
  }

  // Helper for testing: simulate place selection
  _setPlace(place: any) {
    this.mockPlace = place;
    if (this.listeners['place_changed']) {
      this.listeners['place_changed'].forEach((callback) => callback());
    }
  }
}

/**
 * Mock geometry.spherical - For distance calculations
 */
const mockSpherical = {
  /**
   * Compute distance between two points using Haversine formula
   * This is a real implementation, not a mock, because distance calculations
   * are important for your app's business logic
   */
  computeDistanceBetween(from: MockLatLng, to: MockLatLng): number {
    const R = 6371000; // Earth's radius in meters
    const lat1 = (from.lat() * Math.PI) / 180;
    const lat2 = (to.lat() * Math.PI) / 180;
    const deltaLat = ((to.lat() - from.lat()) * Math.PI) / 180;
    const deltaLng = ((to.lng() - from.lng()) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  },
};

/**
 * Mock Size - Represents pixel dimensions
 */
class MockSize {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

/**
 * Mock event namespace
 */
const mockEvent = {
  addListener: vi.fn(),
  removeListener: vi.fn(),
  clearInstanceListeners: vi.fn(),
};

/**
 * Main mock function - Call this in test setup to create the global google object
 */
export function mockGoogleMaps() {
  (global as any).google = {
    maps: {
      Map: MockMap,
      LatLng: MockLatLng,
      LatLngBounds: MockLatLngBounds,
      InfoWindow: MockInfoWindow,
      Circle: MockCircle,
      Size: MockSize,
      marker: {
        AdvancedMarkerElement: MockAdvancedMarkerElement,
      },
      places: {
        Autocomplete: MockAutocomplete,
      },
      geometry: {
        spherical: mockSpherical,
      },
      event: mockEvent,
      DirectionsService: vi.fn().mockImplementation(() => ({
        route: vi.fn(),
      })),
      DirectionsRenderer: vi.fn().mockImplementation(() => ({
        setMap: vi.fn(),
        setDirections: vi.fn(),
      })),
    },
  };

  // Set flag that Maps API is loaded
  (global as any).googleMapsApiLoaded = true;

  return (global as any).google;
}

/**
 * Helper to clean up Google Maps mock
 */
export function cleanupGoogleMaps() {
  delete (global as any).google;
  delete (global as any).googleMapsApiLoaded;
}
