// src/types/global.d.ts

/**
 * Global type definitions for window object extensions and debugging utilities.
 * This file provides proper type safety for properties we add to the window object.
 */

declare global {
  interface Window {
    // Debugging utilities
    clearAppCache?: () => void;

    // Google Maps - already typed by @types/google.maps
    google?: typeof google;

    // Early fetch promise for LCP optimization
    // Set in index.html during HTML parsing, consumed by LocationDataContext
    __LOCATIONS_PROMISE__?: Promise<import('./shop').Shop[] | null>;
  }
}

// This export is necessary to make this a module
export {};