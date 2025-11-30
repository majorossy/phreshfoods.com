// src/components/UI/PlaceAutocomplete.tsx
import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { usePlaceAutocomplete } from '../../hooks/usePlaceAutocomplete';
import { AutocompletePlace } from '../../types';
import './PlaceAutocomplete.css';

export interface PlaceAutocompleteProps {
  /** Callback when a place is selected */
  onPlaceSelect: (place: AutocompletePlace, searchTerm: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Initial value to display in the input */
  initialValue?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Element ID */
  id?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
  /** Country codes to restrict results (default: ['us']) */
  includedRegionCodes?: string[];
  /** Place types to include (default: ['geocode']) */
  types?: string[];
  /** Location bias for results */
  locationBias?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
  /** Whether the autocomplete is disabled */
  disabled?: boolean;
  /** Whether Maps API is ready */
  mapsApiReady?: boolean;
}

export interface PlaceAutocompleteRef {
  /** Set the input value programmatically */
  setInputValue: (value: string) => void;
  /** Focus the input */
  focus: () => void;
  /** Blur the input */
  blur: () => void;
  /** Get current input value */
  getValue: () => string;
}

/**
 * PlaceAutocomplete - Google Places Autocomplete Web Component Wrapper
 *
 * Wraps the new PlaceAutocompleteElement Web Component in a React-friendly interface.
 * Falls back to displaying a standard input if the Maps API isn't ready.
 *
 * This component uses the new Google Places API (PlaceAutocompleteElement) which replaces
 * the deprecated google.maps.places.Autocomplete. The key differences:
 * - Uses 'gmp-select' event instead of 'place_changed'
 * - Requires async fetchFields() to get place details
 * - Uses camelCase field names (displayName, formattedAddress)
 * - Configured via includedRegionCodes instead of componentRestrictions
 */
export const PlaceAutocomplete = forwardRef<PlaceAutocompleteRef, PlaceAutocompleteProps>(({
  onPlaceSelect,
  placeholder = 'Search for a location',
  initialValue = '',
  className = '',
  id,
  ariaLabel = 'Location search',
  includedRegionCodes = ['us'],
  types = ['geocode'],
  locationBias,
  disabled = false,
  mapsApiReady = true
}, ref) => {
  const {
    containerRef,
    setInputValue,
    focusInput,
    blurInput,
    getInputValue
  } = usePlaceAutocomplete({
    onPlaceSelect,
    includedRegionCodes,
    types,
    locationBias,
    disabled: disabled || !mapsApiReady
  });

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setInputValue,
    focus: focusInput,
    blur: blurInput,
    getValue: getInputValue
  }), [setInputValue, focusInput, blurInput, getInputValue]);

  // Set initial value after mount
  useEffect(() => {
    if (initialValue) {
      // Small delay to ensure the Web Component's input is ready
      const timer = setTimeout(() => {
        setInputValue(initialValue);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialValue, setInputValue]);

  // If Maps API isn't ready, show a loading placeholder
  if (!mapsApiReady) {
    return (
      <div
        className={`place-autocomplete-container place-autocomplete-loading ${className}`}
        id={id}
        role="search"
        aria-label={ariaLabel}
      >
        <input
          type="text"
          placeholder="Loading maps..."
          disabled
          className="place-autocomplete-fallback-input"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`place-autocomplete-container ${className}`}
      id={id}
      role="search"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
    />
  );
});

PlaceAutocomplete.displayName = 'PlaceAutocomplete';

export default PlaceAutocomplete;
