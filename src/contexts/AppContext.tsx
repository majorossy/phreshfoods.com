// src/contexts/AppContext.tsx
import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Shop, ShopWithDistance } from '../types'; // Ensure ShopWithDistance is exported
import * as apiService from '../services/apiService';
import { getCookie, setCookie, eraseCookie } from '../utils/cookieHelper';
import {
  LAST_SEARCHED_LOCATION_COOKIE_NAME,
  COOKIE_EXPIRY_DAYS,
} from '../config/appConfig';

export interface AutocompletePlace {
  name?: string;
  formatted_address?: string;
  geometry?: {
    location: google.maps.LatLng | google.maps.LatLngLiteral; // Can be either
    viewport?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
  };
  place_id?: string;
  address_components?: google.maps.GeocoderAddressComponent[];
  types?: string[];
}

interface AppContextType {
  allFarmStands: Shop[];
  setAllFarmStands: React.Dispatch<React.SetStateAction<Shop[]>>;
  currentlyDisplayedShops: ShopWithDistance[]; // --- MODIFIED ---
  setCurrentlyDisplayedShops: React.Dispatch<React.SetStateAction<ShopWithDistance[]>>; // --- MODIFIED ---
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
  openShopOverlays: (shop: Shop, openTab?: 'shop' | 'social' | 'directions') => void; // --- MODIFIED ---
  closeShopOverlays: () => void;
  isInitialModalOpen: boolean;
  setIsInitialModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mapsApiReady: boolean;
  mapViewTargetLocation: AutocompletePlace | null;
  setMapViewTargetLocation: React.Dispatch<React.SetStateAction<AutocompletePlace | null>>;

  // --- ADDED FOR DIRECTIONS ---
  directionsResult: google.maps.DirectionsResult | null;
  directionsError: string | null;
  isFetchingDirections: boolean;
  fetchAndDisplayDirections: (
    origin: google.maps.LatLngLiteral | string | google.maps.Place,
    destination: google.maps.LatLngLiteral | string | google.maps.Place
  ) => Promise<void>;
  clearDirections: () => void;
  // --- END ADDED FOR DIRECTIONS ---
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [allFarmStands, setAllFarmStands] = useState<Shop[]>([]);
  const [currentlyDisplayedShops, setCurrentlyDisplayedShops] = useState<ShopWithDistance[]>([]); // --- MODIFIED ---
  const [activeProductFilters, setActiveProductFilters] = useState<Record<string, boolean>>({});
  const [lastPlaceSelectedByAutocomplete, _setLastPlaceSelectedByAutocompleteInternal] = useState<AutocompletePlace | null>(null);
  const [searchTerm, _setSearchTermInternal] = useState<string>('');
  const [currentRadius, setCurrentRadius] = useState<number>(30);
  const [selectedShop, _setSelectedShopInternal] = useState<Shop | null>(null);
  const [isShopOverlayOpen, setIsShopOverlayOpen] = useState<boolean>(false);
  const [isSocialOverlayOpen, setIsSocialOverlayOpen] = useState<boolean>(false);
  const [isInitialModalOpen, setIsInitialModalOpen] = useState<boolean>(true); // Default to true
  const [mapsApiReady, setMapsApiReady] = useState(false);
  const [mapViewTargetLocation, setMapViewTargetLocation] = useState<AutocompletePlace | null>(null);

  // --- ADDED FOR DIRECTIONS ---
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [isFetchingDirections, setIsFetchingDirections] = useState<boolean>(false);
  // --- END ADDED FOR DIRECTIONS ---

  useEffect(() => {
    apiService.fetchAndProcessFarmStands()
      .then(fetchedStands => {
        if (fetchedStands && Array.isArray(fetchedStands)) {
          setAllFarmStands(fetchedStands);
        } else {
          setAllFarmStands([]);
        }
      })
      .catch(error => {
        console.error("[AppContext] Error fetching initial farm stands:", error);
        setAllFarmStands([]);
      });
  }, []);

  useEffect(() => {
    const checkApi = () => {
      if ((window as any).googleMapsApiLoaded && window.google?.maps?.DirectionsService) {
        setMapsApiReady(true);
        window.removeEventListener('google-maps-api-loaded', checkApi);
      }
    };
    if ((window as any).googleMapsApiLoaded && window.google?.maps?.DirectionsService) {
      setMapsApiReady(true);
    } else {
      window.addEventListener('google-maps-api-loaded', checkApi);
    }
    return () => window.removeEventListener('google-maps-api-loaded', checkApi);
  }, []);

  useEffect(() => {
    const savedLocationCookie = getCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
    if (savedLocationCookie) {
      try {
        const locationData = JSON.parse(savedLocationCookie) as { term: string; place: AutocompletePlace };
        if (locationData?.place?.geometry) {
          _setLastPlaceSelectedByAutocompleteInternal(locationData.place);
          _setSearchTermInternal(locationData.term || '');
          setMapViewTargetLocation(locationData.place);
          setIsInitialModalOpen(false);
        }
      } catch (e) { setIsInitialModalOpen(true); }
    } else { setIsInitialModalOpen(true); }
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

  // --- ADDED FOR DIRECTIONS ---
  const clearDirections = useCallback(() => {
    // console.log("[AppContext] Clearing directions."); // Optional debug
    setDirectionsResult(null);
    setDirectionsError(null);
    setIsFetchingDirections(false);
  }, []);
  // --- END ADDED ---

  const handleSetSelectedShop = useCallback((shop: Shop | null) => {
    _setSelectedShopInternal(shop);
    if (!shop) { // If deselecting shop, also clear any active directions
      clearDirections();
    }
  }, [clearDirections]); // Added clearDirections to dependency array

  // --- MODIFIED openShopOverlays ---
  const openShopOverlays = useCallback((shop: Shop, openTab: 'shop' | 'social' | 'directions' = 'shop') => {
    handleSetSelectedShop(shop); // This will clear previous directions if shop changes
    
    // If opening for directions, ensure social overlay is active, others closed.
    // The SocialOverlay component itself will handle switching to its 'directions' tab.
    if (openTab === 'directions') {
        setIsSocialOverlayOpen(true);
        setIsShopOverlayOpen(false);
    } else if (openTab === 'social') {
        setIsSocialOverlayOpen(true);
        setIsShopOverlayOpen(false);
    } else { // Default to 'shop'
        setIsShopOverlayOpen(true);
        setIsSocialOverlayOpen(false);
    }
    document.body.classList.add('modal-active');
  }, [handleSetSelectedShop]);
  // --- END MODIFIED ---

  const closeShopOverlays = useCallback(() => {
    setIsShopOverlayOpen(false);
    setIsSocialOverlayOpen(false);
    // Don't call setSelectedShop(null) here directly; let the component/action that initiated
    // the close (e.g., map click, App.tsx navigation effect) handle deselecting the shop.
    // This prevents potential loops if setSelectedShop(null) itself triggers this.
    // However, if directions are active, clear them.
    clearDirections();
    document.body.classList.remove('modal-active');
  }, [clearDirections]);

  // --- ADDED FOR DIRECTIONS ---
  const fetchAndDisplayDirections = useCallback(async (
    origin: google.maps.LatLngLiteral | string | google.maps.Place,
    destination: google.maps.LatLngLiteral | string | google.maps.Place
  ) => {
    if (!mapsApiReady || !window.google?.maps?.DirectionsService) {
      console.error("[AppContext] Directions Service not available or Maps API not ready.");
      setDirectionsError("Directions service is not available right now.");
      setIsFetchingDirections(false); // Ensure loading state is reset
      return;
    }

    setIsFetchingDirections(true);
    setDirectionsResult(null);
    setDirectionsError(null);

    const directionsService = new window.google.maps.DirectionsService();
    const request: google.maps.DirectionsRequest = {
      origin: origin,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    // console.log("[AppContext] Requesting directions:", request); // Optional debug
    try {
      const response = await directionsService.route(request);
      if (response.status === 'OK') {
        setDirectionsResult(response);
      } else {
        console.warn('[AppContext] Directions request failed due to ' + response.status);
        setDirectionsError('Could not retrieve directions: ' + response.status);
      }
    } catch (error) {
      console.error('[AppContext] Error fetching directions:', error);
      setDirectionsError('An error occurred while fetching directions.');
    } finally {
      setIsFetchingDirections(false);
    }
  }, [mapsApiReady]);
  // --- END ADDED FOR DIRECTIONS ---

  const value: AppContextType = {
    allFarmStands,
    setAllFarmStands,
    currentlyDisplayedShops,
    setCurrentlyDisplayedShops,
    activeProductFilters,
    setActiveProductFilters,
    lastPlaceSelectedByAutocomplete,
    setLastPlaceSelectedByAutocompleteAndCookie,
    searchTerm,
    setSearchTerm: _setSearchTermInternal,
    currentRadius,
    setCurrentRadius,
    selectedShop,
    setSelectedShop: handleSetSelectedShop,
    isShopOverlayOpen,
    isSocialOverlayOpen,
    openShopOverlays,
    closeShopOverlays,
    isInitialModalOpen,
    setIsInitialModalOpen,
    mapsApiReady,
    mapViewTargetLocation,
    setMapViewTargetLocation,
    // --- ADDED FOR DIRECTIONS ---
    directionsResult,
    directionsError,
    isFetchingDirections,
    fetchAndDisplayDirections,
    clearDirections,
    // --- END ADDED FOR DIRECTIONS ---
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};