// src/contexts/SearchContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AutocompletePlace } from '../types';
import { getCookie, setCookie, eraseCookie } from '../utils/cookieHelper';
import { getLoadError } from '../utils/loadGoogleMapsScript';
import { useToast } from './ToastContext';
import { parseGoogleMapsError, formatErrorMessage } from '../utils/googleMapsErrors';
import { parseFiltersFromURL } from '../utils/urlSync';
import { logger } from '../utils/logger';
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
  const [searchParams] = useSearchParams();
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
      // Parse error for user-friendly message
      const errorInfo = parseGoogleMapsError(error);
      const userMessage = formatErrorMessage(errorInfo);
      showError(userMessage);
    }) as EventListener;

    if (window.googleMapsApiLoaded && window.google?.maps?.DirectionsService) {
      setMapsApiReady(true);
    } else {
      window.addEventListener('google-maps-api-loaded', checkApi);
      window.addEventListener('google-maps-api-error', handleApiError);

      // Check if there was already a load error before this component mounted
      const loadError = getLoadError();
      if (loadError) {
        const errorInfo = parseGoogleMapsError(loadError);
        const userMessage = formatErrorMessage(errorInfo);
        showError(userMessage);
      }
    }

    return () => {
      window.removeEventListener('google-maps-api-loaded', checkApi);
      window.removeEventListener('google-maps-api-error', handleApiError);
    };
  }, [showError]);

  // Load saved location from URL, cookie, or default to Portland, Maine
  // Priority: URL params > Cookie > Default
  useEffect(() => {
    const isDirectFarmUrl = window.location.pathname.startsWith('/farm/');
    if (isDirectFarmUrl) {
      logger.log('[SearchContext] Skipping load - direct farm URL');
      return;
    }

    // Only run if we haven't loaded a location yet
    if (lastPlaceSelectedByAutocomplete) {
      logger.log('[SearchContext] Skipping load - location already set:', lastPlaceSelectedByAutocomplete);
      return;
    }

    logger.log('[SearchContext] Loading saved location...');

    // Parse URL params first (highest priority)
    const urlState = parseFiltersFromURL(searchParams);

    // Check if URL has search location WITH valid name or address
    // (Don't use URL location if it only has coordinates without names)
    if (urlState.searchLocation?.geometry &&
        (urlState.searchLocation.name || urlState.searchLocation.formatted_address)) {
      logger.log('[SearchContext] Loading from URL:', urlState.searchLocation);
      _setLastPlaceSelectedByAutocompleteInternal(urlState.searchLocation);
      _setSearchTermInternal(urlState.searchLocation.formatted_address || urlState.searchLocation.name || '');
      setMapViewTargetLocation(urlState.searchLocation);
      setCurrentRadius(urlState.searchRadius);
      return; // URL params loaded successfully
    }

    // No URL params - check cookie (second priority)
    const savedLocationCookie = getCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
    logger.log('[SearchContext] Cookie value:', savedLocationCookie);

    if (savedLocationCookie) {
      try {
        const locationData = JSON.parse(savedLocationCookie) as { term: string; place: AutocompletePlace };
        logger.log('[SearchContext] Parsed cookie data:', locationData);

        if (locationData?.place?.geometry) {
          logger.log('[SearchContext] Loading from cookie:', locationData);
          _setLastPlaceSelectedByAutocompleteInternal(locationData.place);
          _setSearchTermInternal(locationData.term || '');
          setMapViewTargetLocation(locationData.place);
          // Use radius from URL if specified, otherwise default
          setCurrentRadius(urlState.searchRadius);
          return; // Cookie loaded successfully, don't set default
        }
      } catch (e) {
        console.error('[SearchContext] Error parsing cookie:', e);
        // Invalid cookie data, fall through to default
      }
    }

    // No URL or cookie - set Portland, Maine as default (lowest priority)
    logger.log('[SearchContext] No saved location, using Portland default');
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
    setCurrentRadius(urlState.searchRadius); // Use radius from URL if specified
  }, [lastPlaceSelectedByAutocomplete, searchParams]); // Added dependencies

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
