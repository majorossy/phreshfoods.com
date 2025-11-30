// src/components/Map/MapSearchControls.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { PlaceAutocomplete } from '../UI/PlaceAutocomplete';

/**
 * MapSearchControls - Search and radius controls overlaid on map (all screen sizes)
 *
 * Features:
 * - Google Places Autocomplete for location search (using new PlaceAutocompleteElement)
 * - Radius slider with live updates
 * - Responsive positioning:
 *   - Mobile: Search next to logo (top bar), radius only when nav is open
 *   - Tablet/Desktop: Both controls bottom-left over map
 */
const MapSearchControls: React.FC = () => {
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

  // Memoize location bias for Maine bounds
  const locationBias = useMemo(() => {
    if (MAINE_BOUNDS_LITERAL) {
      return {
        north: MAINE_BOUNDS_LITERAL.north,
        south: MAINE_BOUNDS_LITERAL.south,
        east: MAINE_BOUNDS_LITERAL.east,
        west: MAINE_BOUNDS_LITERAL.west
      };
    }
    return undefined;
  }, []);

  // Display value for initial input
  const displayValue = lastPlaceSelectedByAutocomplete?.formatted_address || searchTerm || '';

  // Shared handler for place selection (used by both mobile and desktop autocomplete)
  const handlePlaceSelect = useCallback((place: AutocompletePlace, term: string) => {
    if (place.geometry) {
      setLastPlaceSelectedByAutocompleteAndCookie(place, term);
      setSearchTerm(term);
      setMapViewTargetLocation(place);
      closeShopOverlays();
    } else {
      setSearchTerm(term);
      setLastPlaceSelectedByAutocompleteAndCookie(null, term);
    }
  }, [setLastPlaceSelectedByAutocompleteAndCookie, setSearchTerm, setMapViewTargetLocation, closeShopOverlays]);

  return (
    <>
      {/* Mobile: Search input in header bar (right of logo) */}
      <div id="map-search-controls-mobile" className="md:hidden fixed top-2 left-24 right-3 z-30">
        <PlaceAutocomplete
          onPlaceSelect={handlePlaceSelect}
          placeholder="Search location..."
          initialValue={displayValue}
          className="place-autocomplete-mobile"
          id="mapSearchAutocompleteMobile"
          ariaLabel="Search for locations by zip code, city, or address"
          types={['geocode', 'establishment']}
          includedRegionCodes={['us']}
          locationBias={locationBias}
          mapsApiReady={mapsApiReady}
        />
      </div>

      {/* Mobile: Radius slider only when nav drawer is open */}
      {isFilterDrawerOpen && (
        <div id="radius-slider-mobile" className="md:hidden fixed top-12 left-3 right-3 z-30">
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
      <div id="map-search-controls-desktop" className="hidden md:flex fixed bottom-6 right-[44%] z-30 items-center gap-3">
        {/* Radius Slider */}
        <div id="radius-slider-desktop" className="flex items-center gap-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
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

        {/* Search Input - desktop with PlaceAutocomplete component */}
        <div id="search-input-desktop">
          <PlaceAutocomplete
            onPlaceSelect={handlePlaceSelect}
            placeholder="Enter a zip, city, or address"
            initialValue={displayValue}
            className="place-autocomplete-desktop"
            id="mapSearchAutocompleteDesktop"
            ariaLabel="Search for locations by zip code, city, or address"
            types={['geocode', 'establishment']}
            includedRegionCodes={['us']}
            locationBias={locationBias}
            mapsApiReady={mapsApiReady}
          />
        </div>
      </div>
    </>
  );
};

export default MapSearchControls;
