// src/contexts/AppContext.tsx
import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Shop } from '../types'; // Assuming PlaceDetails is not needed directly here anymore
import * as apiService from '../services/apiService';
import { getCookie, setCookie, eraseCookie } from '../utils/cookieHelper';
import {
  LAST_SEARCHED_LOCATION_COOKIE_NAME,
  COOKIE_EXPIRY_DAYS,
} from '../config/appConfig';

export interface AutocompletePlace { // Keep this as it's used for lastPlaceSelectedByAutocomplete
  name?: string;
  formatted_address?: string;
  geometry?: {
    location: google.maps.LatLngLiteral;
    viewport?: google.maps.LatLngBoundsLiteral;
  };
  place_id?: string;
  address_components?: any[];
  types?: string[];
}

interface AppContextType {
  allFarmStands: Shop[];
  setAllFarmStands: React.Dispatch<React.SetStateAction<Shop[]>>; // Not usually exposed, but fine
  currentlyDisplayedShops: Shop[];
  setCurrentlyDisplayedShops: React.Dispatch<React.SetStateAction<Shop[]>>;
  activeProductFilters: Record<string, boolean>;
  setActiveProductFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  lastPlaceSelectedByAutocomplete: AutocompletePlace | null;
  setLastPlaceSelectedByAutocompleteAndCookie: (place: AutocompletePlace | null, term: string) => void;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  currentRadius: number;
  setCurrentRadius: React.Dispatch<React.SetStateAction<number>>;
  selectedShop: Shop | null;
  setSelectedShop: (shop: Shop | null) => void;
  isShopOverlayOpen: boolean;
  isSocialOverlayOpen: boolean;
  openShopOverlays: (shop: Shop) => void;
  closeShopOverlays: () => void;
  isInitialModalOpen: boolean;
  setIsInitialModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mapsApiReady: boolean;
  mapViewTargetLocation: AutocompletePlace | null; // For explicitly moving the map
  setMapViewTargetLocation: React.Dispatch<React.SetStateAction<AutocompletePlace | null>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [allFarmStands, setAllFarmStands] = useState<Shop[]>([]);
  const [currentlyDisplayedShops, setCurrentlyDisplayedShops] = useState<Shop[]>([]);
  const [activeProductFilters, setActiveProductFilters] = useState<Record<string, boolean>>({});
  const [lastPlaceSelectedByAutocomplete, _setLastPlaceSelectedByAutocompleteInternal] = useState<AutocompletePlace | null>(null);
  const [searchTerm, _setSearchTermInternal] = useState<string>('');
  const [currentRadius, setCurrentRadius] = useState<number>(30);
  const [selectedShop, _setSelectedShopInternal] = useState<Shop | null>(null);
  const [isShopOverlayOpen, setIsShopOverlayOpen] = useState<boolean>(false);
  const [isSocialOverlayOpen, setIsSocialOverlayOpen] = useState<boolean>(false);
  const [isInitialModalOpen, setIsInitialModalOpen] = useState<boolean>(true);
  const [mapsApiReady, setMapsApiReady] = useState(false);
  const [mapViewTargetLocation, setMapViewTargetLocation] = useState<AutocompletePlace | null>(null);
// AppContext.tsx
useEffect(() => {
  console.log("AppContext: Fetching farm stands...");
  apiService.fetchAndProcessFarmStands()
    .then(fetchedStands => {
      console.log("%cAppContext: Raw fetchedStands from API service:", "color: magenta;", fetchedStands); // <<< AGGRESSIVE LOG
      if (fetchedStands && Array.isArray(fetchedStands)) {
        setAllFarmStands(fetchedStands);
        console.log("%cAppContext: Farm stands SET in context. COUNT: " + fetchedStands.length, "color: green; font-weight: bold;");
      } else {
        console.warn("%cAppContext: fetchedStands is null, undefined, or not an array. Setting allFarmStands to []. Fetched was:", "color: orange;", fetchedStands);
        setAllFarmStands([]);
      }
    })
    .catch(error => {
      console.error("%cAppContext: Error setting farm stands after fetch:", "color: red; font-weight: bold;", error);
      setAllFarmStands([]);
    });
}, []);

  useEffect(() => {
    const checkApi = () => {
      if ((window as any).googleMapsApiLoaded) {
        console.log("AppContext: Google Maps API detected as loaded.");
        setMapsApiReady(true);
        window.removeEventListener('google-maps-api-loaded', checkApi);
      }
    };
    if ((window as any).googleMapsApiLoaded) {
      console.log("AppContext: Google Maps API was already loaded on init.");
      setMapsApiReady(true);
    } else {
      console.log("AppContext: Waiting for Google Maps API...");
      window.addEventListener('google-maps-api-loaded', checkApi);
    }
    return () => window.removeEventListener('google-maps-api-loaded', checkApi);
  }, []);

  useEffect(() => {
    apiService.fetchAndProcessFarmStands()
      .then(fetchedStands => {
        setAllFarmStands(fetchedStands);
        console.log("AppContext: Farm stands fetched, COUNT:", fetchedStands.length);
      })
      .catch(error => console.error("AppContext: Error fetching initial farm stands:", error));
  }, []);

  useEffect(() => {
    const savedLocationCookie = getCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
    if (savedLocationCookie) {
      try {
        const locationData = JSON.parse(savedLocationCookie) as { term: string; place: AutocompletePlace };
        if (locationData && locationData.place && locationData.place.geometry) {
          console.log("AppContext: Loading location from cookie", locationData);
          _setLastPlaceSelectedByAutocompleteInternal(locationData.place);
          _setSearchTermInternal(locationData.term || '');
          setMapViewTargetLocation(locationData.place); // Also move map to cookie location
          setIsInitialModalOpen(false);
        }
      } catch (e) { console.error("AppContext: Error parsing location cookie", e); setIsInitialModalOpen(true); }
    } else { setIsInitialModalOpen(true); }
  }, [_setLastPlaceSelectedByAutocompleteInternal, _setSearchTermInternal, setIsInitialModalOpen, setMapViewTargetLocation]);

  const setLastPlaceSelectedByAutocompleteAndCookie = useCallback((place: AutocompletePlace | null, term: string) => {
    _setLastPlaceSelectedByAutocompleteInternal(place);
    _setSearchTermInternal(term); // Also update the search term display
    if (place && place.geometry && term) {
      setCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME, JSON.stringify({ term, place }), COOKIE_EXPIRY_DAYS);
    } else {
      eraseCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
    }
  }, [_setLastPlaceSelectedByAutocompleteInternal, _setSearchTermInternal]);

  const handleSetSelectedShop = useCallback((shop: Shop | null) => {
    console.log("AppContext: setSelectedShop called with:", shop ? shop.Name : null);
    _setSelectedShopInternal(shop);
  }, [_setSelectedShopInternal]);

  const openShopOverlays = useCallback((shop: Shop) => {
    handleSetSelectedShop(shop); // Use the new centralized setter
    setIsShopOverlayOpen(true);
    setIsSocialOverlayOpen(true); // Assuming both open for one action, adjust if needed
    document.body.classList.add('modal-active');
  }, [handleSetSelectedShop, setIsShopOverlayOpen, setIsSocialOverlayOpen]);

  const closeShopOverlays = useCallback(() => {
    setIsShopOverlayOpen(false);
    setIsSocialOverlayOpen(false);
    // Decide if setSelectedShop(null) should be called here or separately
    // handleSetSelectedShop(null); // If closing overlays always deselects
    document.body.classList.remove('modal-active');
  }, [setIsShopOverlayOpen, setIsSocialOverlayOpen]);

  const value: AppContextType = {
    allFarmStands,
    setAllFarmStands, // Ok to expose if some other part of app needs to refresh all
    currentlyDisplayedShops,
    setCurrentlyDisplayedShops,
    activeProductFilters,
    setActiveProductFilters,
    lastPlaceSelectedByAutocomplete,
    setLastPlaceSelectedByAutocompleteAndCookie,
    searchTerm,
    setSearchTerm: _setSearchTermInternal, // Expose the direct setter
    currentRadius,
    setCurrentRadius,
    selectedShop,
    setSelectedShop: handleSetSelectedShop, // Expose the wrapped setter
    isShopOverlayOpen,
    isSocialOverlayOpen,
    openShopOverlays,
    closeShopOverlays,
    isInitialModalOpen,
    setIsInitialModalOpen,
    mapsApiReady,
    mapViewTargetLocation,
    setMapViewTargetLocation,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};