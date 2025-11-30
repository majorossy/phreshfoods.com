// src/hooks/usePlaceAutocomplete.ts
// @ts-nocheck - Temporarily disabled for production build testing
import { useRef, useEffect, useCallback, useState } from 'react';
import { AutocompletePlace, PlaceSelectEvent } from '../types';

interface UsePlaceAutocompleteOptions {
  onPlaceSelect: (place: AutocompletePlace, searchTerm: string) => void;
  includedRegionCodes?: string[];
  types?: string[];
  locationBias?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
  disabled?: boolean;
}

/**
 * Custom hook for Google Places Autocomplete
 *
 * Attempts to use the new PlaceAutocompleteElement Web Component first,
 * and falls back to the legacy google.maps.places.Autocomplete if the new
 * API isn't available. This ensures compatibility during the transition period.
 *
 * @param options - Configuration options for the autocomplete
 * @returns Object containing refs and utility functions
 */
export function usePlaceAutocomplete(options: UsePlaceAutocompleteOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isUsingLegacy, setIsUsingLegacy] = useState(false);

  // Handler for new PlaceAutocompleteElement's gmp-select event
  const handleNewApiPlaceSelect = useCallback(async (event: Event) => {
    const placeEvent = event as PlaceSelectEvent;
    const placePrediction = placeEvent.placePrediction;

    if (!placePrediction) {
      return;
    }

    try {
      const place = placePrediction.toPlace();

      // Fetch the fields we need (new API requires explicit field requests)
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'addressComponents', 'types', 'id']
      });

      // Convert to AutocompletePlace format for backward compatibility
      const autocompletePlace: AutocompletePlace = {
        name: place.displayName || '',
        formatted_address: place.formattedAddress || '',
        geometry: place.location ? {
          location: {
            lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
            lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng
          },
          viewport: place.viewport
        } : undefined,
        place_id: place.id,
        address_components: place.addressComponents,
        types: place.types
      };

      const searchTerm = place.formattedAddress || place.displayName || '';
      options.onPlaceSelect(autocompletePlace, searchTerm);
    } catch (error) {
      console.error('[PlaceAutocomplete] Error fetching place details:', error);
    }
  }, [options]);

  // Handler for legacy Autocomplete's place_changed event
  const handleLegacyPlaceChanged = useCallback(() => {
    const autocomplete = autocompleteRef.current as google.maps.places.Autocomplete | null;
    if (!autocomplete) return;

    const placeResult = autocomplete.getPlace();
    if (placeResult.geometry && placeResult.geometry.location) {
      const autocompletePlace: AutocompletePlace = {
        name: placeResult.name,
        formatted_address: placeResult.formatted_address,
        geometry: {
          location: {
            lat: placeResult.geometry.location.lat(),
            lng: placeResult.geometry.location.lng(),
          },
          viewport: placeResult.geometry.viewport
        },
        place_id: placeResult.place_id,
        address_components: placeResult.address_components,
        types: placeResult.types
      };

      const searchTerm = placeResult.formatted_address || placeResult.name || '';
      options.onPlaceSelect(autocompletePlace, searchTerm);
    }
  }, [options]);

  // Initialize with new API or fall back to legacy
  useEffect(() => {
    // Don't initialize if disabled or container not ready
    if (options.disabled || !containerRef.current) {
      return;
    }

    // Check if Google Maps is loaded
    if (!window.google?.maps?.places) {
      return;
    }

    // Clean up any existing instance
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Try to use new PlaceAutocompleteElement first
    const useNewApi = typeof google.maps.places.PlaceAutocompleteElement === 'function';

    if (useNewApi) {
      try {
        // Create the PlaceAutocompleteElement
        const autocomplete = new google.maps.places.PlaceAutocompleteElement({
          types: options.types || ['geocode'],
          includedRegionCodes: options.includedRegionCodes || ['us'],
          locationBias: options.locationBias
        });

        // Add event listener for place selection
        autocomplete.addEventListener('gmp-select', handleNewApiPlaceSelect);

        // Append to container
        containerRef.current.appendChild(autocomplete);
        autocompleteRef.current = autocomplete;
        setIsUsingLegacy(false);

        // Try to get reference to the internal input element
        const observer = new MutationObserver(() => {
          const input = autocomplete.querySelector('input') ||
                        autocomplete.shadowRoot?.querySelector('input');
          if (input) {
            inputRef.current = input;
            observer.disconnect();
          }
        });

        observer.observe(autocomplete, { childList: true, subtree: true });

        // Check immediately
        const existingInput = autocomplete.querySelector('input') ||
                              autocomplete.shadowRoot?.querySelector('input');
        if (existingInput) {
          inputRef.current = existingInput;
          observer.disconnect();
        }

        // Store cleanup function
        cleanupRef.current = () => {
          observer.disconnect();
          autocomplete.removeEventListener('gmp-select', handleNewApiPlaceSelect);
          if (containerRef.current?.contains(autocomplete)) {
            containerRef.current.removeChild(autocomplete);
          }
          autocompleteRef.current = null;
          inputRef.current = null;
        };

        return () => {
          if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
          }
        };
      } catch (e) {
        console.warn('[PlaceAutocomplete] Failed to create PlaceAutocompleteElement, falling back to legacy:', e);
        // Fall through to legacy implementation
      }
    }

    // Fallback: Use legacy Autocomplete
    setIsUsingLegacy(true);

    // Create an input element for the legacy autocomplete
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'place-autocomplete-legacy-input';
    input.placeholder = containerRef.current.dataset.placeholder || 'Search for a location';
    input.setAttribute('aria-label', containerRef.current.getAttribute('aria-label') || 'Location search');
    containerRef.current.appendChild(input);
    inputRef.current = input;

    // Configure legacy autocomplete options
    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      types: options.types || ['geocode'],
      componentRestrictions: { country: options.includedRegionCodes?.[0] || 'us' },
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components', 'types'],
    };

    // Add location bias if provided
    if (options.locationBias) {
      const bias = options.locationBias;
      if ('north' in bias && 'south' in bias && 'east' in bias && 'west' in bias) {
        autocompleteOptions.bounds = new google.maps.LatLngBounds(
          { lat: bias.south, lng: bias.west },
          { lat: bias.north, lng: bias.east }
        );
        autocompleteOptions.strictBounds = false;
      }
    }

    // Create legacy Autocomplete
    const autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions);
    autocompleteRef.current = autocomplete;

    // Add place_changed listener
    const listener = autocomplete.addListener('place_changed', handleLegacyPlaceChanged);

    // Store cleanup function
    cleanupRef.current = () => {
      google.maps.event.removeListener(listener);
      google.maps.event.clearInstanceListeners(autocomplete);
      if (containerRef.current?.contains(input)) {
        containerRef.current.removeChild(input);
      }
      // Clean up pac-container dropdowns
      const pacContainers = document.getElementsByClassName('pac-container');
      for (let i = pacContainers.length - 1; i >= 0; i--) {
        pacContainers[i].remove();
      }
      autocompleteRef.current = null;
      inputRef.current = null;
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [handleNewApiPlaceSelect, handleLegacyPlaceChanged, options.types, options.includedRegionCodes, options.locationBias, options.disabled]);

  /**
   * Set the input value programmatically
   */
  const setInputValue = useCallback((value: string) => {
    if (inputRef.current) {
      inputRef.current.value = value;
    }
  }, []);

  /**
   * Focus the input element
   */
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Blur the input element
   */
  const blurInput = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  /**
   * Get current input value
   */
  const getInputValue = useCallback(() => {
    return inputRef.current?.value || '';
  }, []);

  return {
    containerRef,
    autocompleteRef,
    inputRef,
    setInputValue,
    focusInput,
    blurInput,
    getInputValue,
    isUsingLegacy
  };
}
