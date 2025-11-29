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
 * MapSearchControls - Search and radius controls overlaid on map (desktop only)
 *
 * Features:
 * - Google Places Autocomplete for location search
 * - Radius slider with live updates
 * - Positioned bottom-left over map
 * - Hidden on mobile/tablet (< 1024px)
 * - Shows on desktop (1024px+)
 */
const MapSearchControls: React.FC = () => {
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = useRef<google.maps.places.Autocomplete | null>(null);
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

  const { closeShopOverlays } = useUI();

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

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!mapsApiReady || !autocompleteInputRef.current || !window.google?.maps?.places) {
      return;
    }

    if (!document.contains(autocompleteInputRef.current)) {
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

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        autocompleteOptions
      );
      autocompleteInstanceRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
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
          setMapViewTargetLocation(adaptedPlace); // Update map center pin location
          closeShopOverlays();
        } else {
          const currentInputVal = autocompleteInputRef.current?.value || '';
          setSearchTerm(currentInputVal);
          setLastPlaceSelectedByAutocompleteAndCookie(null, currentInputVal);
        }
      });
    } catch (error) {
      autocompleteInstanceRef.current = null;
    }

    return () => {
      if (autocompleteInstanceRef.current) {
        try {
          google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
        } catch (e) {
          // Ignore cleanup errors
        }
        autocompleteInstanceRef.current = null;
      }
    };
  }, [mapsApiReady, setLastPlaceSelectedByAutocompleteAndCookie, setSearchTerm, setMapViewTargetLocation, closeShopOverlays]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const displayValue = lastPlaceSelectedByAutocomplete?.formatted_address || searchTerm || '';
    setInputValue(displayValue);
  }, [lastPlaceSelectedByAutocomplete, searchTerm]);

  return (
    <div
      className="
        hidden lg:flex
        fixed bottom-6 left-6 z-30
        items-center gap-3
      "
    >
      {/* Radius Slider - compact design */}
      <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
        <label
          htmlFor="radiusSliderMap"
          className="text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300"
        >
          Radius:
        </label>
        <input
          type="range"
          id="radiusSliderMap"
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

      {/* Search Input */}
      <div>
        <label htmlFor="mapSearchAutocomplete" className="sr-only">
          Search for locations by zip, city, or address
        </label>
        <input
          ref={autocompleteInputRef}
          id="mapSearchAutocomplete"
          type="text"
          placeholder="Enter a zip, city, or address"
          className="
            w-64 p-2.5
            border border-gray-300 dark:border-gray-600
            rounded-lg shadow-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            text-sm
            bg-white/90 dark:bg-gray-800/90
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
  );
};

export default MapSearchControls;
