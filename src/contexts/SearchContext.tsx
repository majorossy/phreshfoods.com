// src/contexts/SearchContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { AutocompletePlace } from '../types';
import { getCookie, setCookie, eraseCookie } from '../utils/cookieHelper';
import { getLoadError } from '../utils/loadGoogleMapsScript';
import { useToast } from './ToastContext';
import {
  LAST_SEARCHED_LOCATION_COOKIE_NAME,
  COOKIE_EXPIRY_DAYS,
  DEFAULT_SEARCH_RADIUS_MILES,
  DEFAULT_PORTLAND_CENTER,
} from '../config/appConfig';

interface SearchContextType {
  lastPlaceSelectedByAutocomplete: AutocompletePlace | null;
  setLastPlaceSelectedByAutocompleteAndCookie: (place: AutocompletePlace | null, term: string) => void;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  currentRadius: number;
  setCurrentRadius: React.Dispatch<React.SetStateAction<number>>;
  mapsApiReady: boolean;
  mapViewTargetLocation: AutocompletePlace | null;
  setMapViewTargetLocation: React.Dispatch<React.SetStateAction<AutocompletePlace | null>>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const { showError } = useToast();
  const [lastPlaceSelectedByAutocomplete, _setLastPlaceSelectedByAutocompleteInternal] = useState<AutocompletePlace | null>(null);
  const [searchTerm, _setSearchTermInternal] = useState<string>('');
  const [currentRadius, setCurrentRadius] = useState<number>(DEFAULT_SEARCH_RADIUS_MILES);
  const [mapsApiReady, setMapsApiReady] = useState(false);
  const [mapViewTargetLocation, setMapViewTargetLocation] = useState<AutocompletePlace | null>(null);

  // Check Maps API readiness and handle errors
  useEffect(() => {
    const checkApi = () => {
      if (window.googleMapsApiLoaded && window.google?.maps?.DirectionsService) {
        setMapsApiReady(true);
        window.removeEventListener('google-maps-api-loaded', checkApi);
      }
    };

    const handleApiError = ((event: CustomEvent) => {
      const error = event.detail as Error;
      showError(error.message || 'Failed to load Google Maps. Please refresh the page.');
    }) as EventListener;

    if (window.googleMapsApiLoaded && window.google?.maps?.DirectionsService) {
      setMapsApiReady(true);
    } else {
      window.addEventListener('google-maps-api-loaded', checkApi);
      window.addEventListener('google-maps-api-error', handleApiError);

      // Check if there was already a load error before this component mounted
      const loadError = getLoadError();
      if (loadError) {
        showError(loadError.message);
      }
    }

    return () => {
      window.removeEventListener('google-maps-api-loaded', checkApi);
      window.removeEventListener('google-maps-api-error', handleApiError);
    };
  }, [showError]);

  // Load saved location from cookie, or default to Portland, Maine
  useEffect(() => {
    const isDirectFarmUrl = window.location.pathname.startsWith('/farm/');
    if (isDirectFarmUrl) return;

    const savedLocationCookie = getCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
    if (savedLocationCookie) {
      try {
        const locationData = JSON.parse(savedLocationCookie) as { term: string; place: AutocompletePlace };
        if (locationData?.place?.geometry) {
          _setLastPlaceSelectedByAutocompleteInternal(locationData.place);
          _setSearchTermInternal(locationData.term || '');
          setMapViewTargetLocation(locationData.place);
          return; // Cookie loaded successfully, don't set default
        }
      } catch (e) {
        // Invalid cookie data, fall through to default
      }
    }

    // No cookie or invalid cookie - set Portland, Maine as default
    const portlandPlace: AutocompletePlace = {
      name: "Portland, Maine",
      formatted_address: "Portland, ME, USA",
      geometry: {
        location: DEFAULT_PORTLAND_CENTER,
        viewport: undefined
      },
      place_id: undefined,
      address_components: undefined,
      types: undefined
    };

    _setLastPlaceSelectedByAutocompleteInternal(portlandPlace);
    _setSearchTermInternal('Portland, ME, USA');
    setMapViewTargetLocation(portlandPlace);
  }, []);

  const setLastPlaceSelectedByAutocompleteAndCookie = useCallback((place: AutocompletePlace | null, term: string) => {
    _setLastPlaceSelectedByAutocompleteInternal(place);
    _setSearchTermInternal(term);
    if (place?.geometry && term) {
      setCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME, JSON.stringify({ term, place }), COOKIE_EXPIRY_DAYS);
    } else {
      eraseCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value: SearchContextType = useMemo(() => ({
    lastPlaceSelectedByAutocomplete,
    setLastPlaceSelectedByAutocompleteAndCookie,
    searchTerm,
    setSearchTerm: _setSearchTermInternal,
    currentRadius,
    setCurrentRadius,
    mapsApiReady,
    mapViewTargetLocation,
    setMapViewTargetLocation,
  }), [
    lastPlaceSelectedByAutocomplete,
    setLastPlaceSelectedByAutocompleteAndCookie,
    searchTerm,
    currentRadius,
    mapsApiReady,
    mapViewTargetLocation,
  ]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
