// src/types/google-maps.ts
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
