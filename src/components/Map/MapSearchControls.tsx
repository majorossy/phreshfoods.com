// src/components/Map/MapSearchControls.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AutocompletePlace } from '../../types';
import {
  MAINE_BOUNDS_LITERAL,
  DEFAULT_SEARCH_RADIUS_MILES,
  RADIUS_SLIDER_MIN_MILES,
  RADIUS_SLIDER_MAX_MILES,
  RADIUS_SLIDER_STEP_MILES,
  RADIUS_DEBOUNCE_MS,
} from '../../config/appConfig';
import { useDebounce } from '../../hooks/useDebounce';
import { useSearch } from '../../contexts/SearchContext';
import { useUI } from '../../contexts/UIContext';

/**
 * MapSearchControls - Search and radius controls overlaid on map (all screen sizes)
 *
 * Features:
 * - Google Places Autocomplete for location search
 * - Radius slider with live updates
 * - Responsive positioning:
 *   - Mobile: Search next to logo (top bar), radius only when nav is open
 *   - Tablet/Desktop: Both controls bottom-left over map
 */
const MapSearchControls: React.FC = () => {
  // Separate refs for mobile and desktop inputs (only one visible at a time based on screen size)
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const desktopAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Local state for radius slider (for immediate UI feedback)
  const [localRadius, setLocalRadius] = useState<number>(DEFAULT_SEARCH_RADIUS_MILES);
  const debouncedRadius = useDebounce(localRadius, RADIUS_DEBOUNCE_MS);

  const {
    setLastPlaceSelectedByAutocompleteAndCookie,
    searchTerm,
    setSearchTerm,
    mapsApiReady,
    currentRadius,
    setCurrentRadius,
    lastPlaceSelectedByAutocomplete,
    setMapViewTargetLocation,
  } = useSearch();

  const { closeShopOverlays, isFilterDrawerOpen } = useUI();

  // Initialize local radius from context
  useEffect(() => {
    setLocalRadius(currentRadius);
  }, [currentRadius]);

  // Update context radius when debounced value changes
  useEffect(() => {
    if (setCurrentRadius && debouncedRadius !== currentRadius) {
      setCurrentRadius(debouncedRadius);
    }
  }, [debouncedRadius, currentRadius, setCurrentRadius]);

  // Display current search location in input
  useEffect(() => {
    const displayValue = lastPlaceSelectedByAutocomplete?.formatted_address || searchTerm || '';
    setInputValue(displayValue);
  }, [lastPlaceSelectedByAutocomplete, searchTerm]);

  // Shared handler for place selection (used by both mobile and desktop autocomplete)
  const handlePlaceChanged = useCallback((
    autocomplete: google.maps.places.Autocomplete,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    const placeResult = autocomplete.getPlace();
    if (placeResult.geometry && placeResult.geometry.location) {
      const adaptedPlace: AutocompletePlace = {
        name: placeResult.name,
        formatted_address: placeResult.formatted_address,
        geometry: {
          location: {
            lat: placeResult.geometry.location.lat(),
            lng: placeResult.geometry.location.lng(),
          },
        },
        place_id: placeResult.place_id,
        address_components: placeResult.address_components,
        types: placeResult.types,
      };

      const addressForDisplay = placeResult.formatted_address || placeResult.name || '';
      setLastPlaceSelectedByAutocompleteAndCookie(adaptedPlace, addressForDisplay);
      setSearchTerm(addressForDisplay);
      setMapViewTargetLocation(adaptedPlace);
      closeShopOverlays();
    } else {
      const currentInputVal = inputRef.current?.value || '';
      setSearchTerm(currentInputVal);
      setLastPlaceSelectedByAutocompleteAndCookie(null, currentInputVal);
    }
  }, [setLastPlaceSelectedByAutocompleteAndCookie, setSearchTerm, setMapViewTargetLocation, closeShopOverlays]);

  // Initialize Google Places Autocomplete for both mobile and desktop inputs
  useEffect(() => {
    if (!mapsApiReady || !window.google?.maps?.places) {
      return;
    }

    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'us' },
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components', 'types'],
    };

    if (MAINE_BOUNDS_LITERAL) {
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(MAINE_BOUNDS_LITERAL.south, MAINE_BOUNDS_LITERAL.west),
        new google.maps.LatLng(MAINE_BOUNDS_LITERAL.north, MAINE_BOUNDS_LITERAL.east)
      );
      autocompleteOptions.bounds = bounds;
      autocompleteOptions.strictBounds = false;
    }

    // Initialize mobile autocomplete
    if (mobileInputRef.current && document.contains(mobileInputRef.current)) {
      try {
        const mobileAutocomplete = new window.google.maps.places.Autocomplete(
          mobileInputRef.current,
          autocompleteOptions
        );
        mobileAutocompleteRef.current = mobileAutocomplete;
        mobileAutocomplete.addListener('place_changed', () => {
          handlePlaceChanged(mobileAutocomplete, mobileInputRef);
        });
      } catch {
        mobileAutocompleteRef.current = null;
      }
    }

    // Initialize desktop autocomplete
    if (desktopInputRef.current && document.contains(desktopInputRef.current)) {
      try {
        const desktopAutocomplete = new window.google.maps.places.Autocomplete(
          desktopInputRef.current,
          autocompleteOptions
        );
        desktopAutocompleteRef.current = desktopAutocomplete;
        desktopAutocomplete.addListener('place_changed', () => {
          handlePlaceChanged(desktopAutocomplete, desktopInputRef);
        });
      } catch {
        desktopAutocompleteRef.current = null;
      }
    }

    return () => {
      // Cleanup mobile autocomplete
      if (mobileAutocompleteRef.current) {
        try {
          google.maps.event.clearInstanceListeners(mobileAutocompleteRef.current);
        } catch {
          // Ignore cleanup errors
        }
        mobileAutocompleteRef.current = null;
      }
      // Cleanup desktop autocomplete
      if (desktopAutocompleteRef.current) {
        try {
          google.maps.event.clearInstanceListeners(desktopAutocompleteRef.current);
        } catch {
          // Ignore cleanup errors
        }
        desktopAutocompleteRef.current = null;
      }
    };
  }, [mapsApiReady, handlePlaceChanged]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const displayValue = lastPlaceSelectedByAutocomplete?.formatted_address || searchTerm || '';
    setInputValue(displayValue);
  }, [lastPlaceSelectedByAutocomplete, searchTerm]);

  return (
    <>
      {/* Mobile: Search input in header bar (right of logo) */}
      <div className="md:hidden fixed top-2 left-24 right-3 z-30">
        <label htmlFor="mapSearchAutocompleteMobile" className="sr-only">
          Search for locations by zip, city, or address
        </label>
        <input
          ref={mobileInputRef}
          id="mapSearchAutocompleteMobile"
          type="text"
          placeholder="Search location..."
          className="
            w-full px-3 py-2
            rounded-lg shadow-md
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            text-sm
            bg-white/90 dark:bg-gray-800/90
            backdrop-blur-sm
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            border-0
          "
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          aria-label="Search for locations by zip code, city, or address"
        />
      </div>

      {/* Mobile: Radius slider only when nav drawer is open */}
      {isFilterDrawerOpen && (
        <div className="md:hidden fixed top-12 left-3 right-3 z-30">
          <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
            <label
              htmlFor="radiusSliderMobile"
              className="text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300"
            >
              Radius:
            </label>
            <input
              type="range"
              id="radiusSliderMobile"
              name="radius"
              min={RADIUS_SLIDER_MIN_MILES}
              max={RADIUS_SLIDER_MAX_MILES}
              value={localRadius}
              step={RADIUS_SLIDER_STEP_MILES}
              onChange={(e) => setLocalRadius(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
              aria-label="Search radius"
              aria-valuemin={RADIUS_SLIDER_MIN_MILES}
              aria-valuemax={RADIUS_SLIDER_MAX_MILES}
              aria-valuenow={localRadius}
              aria-valuetext={`${localRadius} miles`}
            />
            <span
              className="text-xs font-semibold w-10 text-center text-gray-700 dark:text-gray-300"
              aria-live="polite"
            >
              {localRadius} mi
            </span>
          </div>
        </div>
      )}

      {/* Tablet/Desktop: Both controls at bottom-right of map area (to right of social overlay, left of listings panel) */}
      {/* Positioned from right: 42% (listings panel) + small gap = ~44% from right edge */}
      <div className="hidden md:flex fixed bottom-6 right-[44%] z-30 items-center gap-3">
        {/* Radius Slider */}
        <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
          <label
            htmlFor="radiusSliderDesktop"
            className="text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300"
          >
            Radius:
          </label>
          <input
            type="range"
            id="radiusSliderDesktop"
            name="radius"
            min={RADIUS_SLIDER_MIN_MILES}
            max={RADIUS_SLIDER_MAX_MILES}
            value={localRadius}
            step={RADIUS_SLIDER_STEP_MILES}
            onChange={(e) => setLocalRadius(Number(e.target.value))}
            className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
            aria-label="Search radius"
            aria-valuemin={RADIUS_SLIDER_MIN_MILES}
            aria-valuemax={RADIUS_SLIDER_MAX_MILES}
            aria-valuenow={localRadius}
            aria-valuetext={`${localRadius} miles`}
          />
          <span
            className="text-xs font-semibold w-10 text-center text-gray-700 dark:text-gray-300"
            aria-live="polite"
          >
            {localRadius} mi
          </span>
        </div>

        {/* Search Input - desktop with its own autocomplete instance */}
        <div>
          <label htmlFor="mapSearchAutocompleteDesktop" className="sr-only">
            Search for locations by zip, city, or address
          </label>
          <input
            ref={desktopInputRef}
            id="mapSearchAutocompleteDesktop"
            type="text"
            placeholder="Enter a zip, city, or address"
            className="
              w-64 p-2.5
              border border-gray-300 dark:border-gray-600
              rounded-lg shadow-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              text-sm
              bg-white/95 dark:bg-gray-800/95
              backdrop-blur-sm
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
            "
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            aria-label="Search for locations by zip code, city, or address"
          />
        </div>
      </div>
    </>
  );
};

export default MapSearchControls;
