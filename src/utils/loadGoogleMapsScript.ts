// src/utils/loadGoogleMapsScript.ts

/**
 * Dynamically loads the Google Maps JavaScript API with the API key from environment variables
 * This approach is more secure than hardcoding the key in index.html
 */

let isLoading = false;
let isLoaded = false;
let loadError: Error | null = null;

export function loadGoogleMapsScript(): Promise<void> {
  // If already loaded, return immediately
  if (isLoaded) {
    return Promise.resolve();
  }

  // If previous load failed, return the error
  if (loadError) {
    return Promise.reject(loadError);
  }

  // If currently loading, return existing promise
  if (isLoading) {
    return new Promise((resolve, reject) => {
      window.addEventListener('google-maps-api-loaded', () => resolve(), { once: true });
      window.addEventListener('google-maps-api-error', ((event: CustomEvent) => {
        reject(event.detail);
      }) as EventListener, { once: true });
    });
  }

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    const error = new Error('Google Maps API key not configured. Please check your environment variables.');
    loadError = error;

    // Dispatch error event for other listeners
    window.dispatchEvent(new CustomEvent('google-maps-api-error', { detail: error }));

    return Promise.reject(error);
  }

  isLoading = true;

  return new Promise((resolve, reject) => {
    // Define the global callback function
    (window as any).initAppMapGlobal = () => {
      (window as any).googleMapsApiLoaded = true;
      window.dispatchEvent(new CustomEvent('google-maps-api-loaded'));
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    // Listen for Google Maps API errors (auth failures, quota exceeded, etc.)
    (window as any).gm_authFailure = () => {
      isLoading = false;
      const error = new Error(
        'Google Maps authentication failed. The API key may have restrictions that block this website. ' +
        'Please contact support if this issue persists.'
      );
      loadError = error;
      window.dispatchEvent(new CustomEvent('google-maps-api-error', { detail: error }));
      reject(error);
    };

    // Create and append the script tag
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    // Only load libraries we actually use: places (autocomplete), geometry (distance), marker (AdvancedMarkerElement)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&loading=async&callback=initAppMapGlobal`;
    script.onerror = () => {
      isLoading = false;
      const error = new Error('Failed to load Google Maps API. Please check your internet connection and try again.');
      loadError = error;

      // Dispatch error event for other listeners
      window.dispatchEvent(new CustomEvent('google-maps-api-error', { detail: error }));

      reject(error);
    };

    document.head.appendChild(script);
  });
}

/**
 * Check if Google Maps API is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return isLoaded;
}

/**
 * Get the last load error if any
 */
export function getLoadError(): Error | null {
  return loadError;
}
