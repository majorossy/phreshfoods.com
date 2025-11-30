// src/types/google-maps.ts
// @ts-nocheck - Temporarily disabled for production build testing
// Google Maps API related types

export interface AutocompletePlace {
  name?: string;
  formatted_address?: string;
  geometry?: {
    location: google.maps.LatLng | google.maps.LatLngLiteral;
    viewport?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
  };
  place_id?: string;
  address_components?: google.maps.GeocoderAddressComponent[];
  types?: string[];
}

// New PlaceAutocompleteElement types (replacing deprecated google.maps.places.Autocomplete)
// See: https://developers.google.com/maps/documentation/javascript/place-autocomplete-element

/**
 * Options for creating a PlaceAutocompleteElement
 */
export interface PlaceAutocompleteElementOptions {
  types?: string[];
  includedRegionCodes?: string[];
  includedPrimaryTypes?: string[];
  locationBias?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
  locationRestriction?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
}

/**
 * Place object returned from the new Places API
 * Uses camelCase field names (unlike legacy snake_case)
 */
export interface PlaceResult {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: google.maps.LatLng;
  viewport?: google.maps.LatLngBounds;
  addressComponents?: google.maps.GeocoderAddressComponent[];
  types?: string[];
}

/**
 * Event emitted when a place is selected from PlaceAutocompleteElement
 */
export interface PlaceSelectEvent extends Event {
  placePrediction: {
    toPlace(): PlaceResult & {
      fetchFields(options: { fields: string[] }): Promise<{ place: PlaceResult }>;
    };
  };
}

// Extend the global google.maps.places namespace
declare global {
  namespace google.maps.places {
    interface PlaceAutocompleteElementOptions {
      types?: string[];
      includedRegionCodes?: string[];
      includedPrimaryTypes?: string[];
      locationBias?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
      locationRestriction?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
    }

    class PlaceAutocompleteElement extends HTMLElement {
      constructor(options?: PlaceAutocompleteElementOptions);
    }
  }
}
