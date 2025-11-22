// src/contexts/AppContext.tsx
/**
 * Legacy AppContext for backward compatibility
 *
 * This context now wraps the new domain-specific contexts:
 * - FarmDataContext
 * - SearchContext
 * - FilterContext
 * - UIContext
 * - DirectionsContext
 *
 * New code should use the specific contexts directly via their hooks:
 * - useFarmData()
 * - useSearch()
 * - useFilters()
 * - useUI()
 * - useDirections()
 *
 * This file is kept for backward compatibility with existing components.
 */
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Shop, ShopWithDistance, AutocompletePlace, ToastType } from '../types';
import { AppProviders } from './AppProviders';
import { useFarmData } from './FarmDataContext';
import { useSearch } from './SearchContext';
import { useFilters } from './FilterContext';
import { useUI } from './UIContext';
import { useDirections } from './DirectionsContext';
import { setToastHandler as setFarmDataToastHandler } from './FarmDataContext';
import { setDirectionsToastHandler } from './DirectionsContext';

// Toast handler for notifications (shared across contexts)
let toastHandler: ((type: ToastType, message: string) => void) | null = null;

export const setToastHandler = (handler: (type: ToastType, message: string) => void) => {
  toastHandler = handler;
  // Also set the handler for the individual contexts
  setFarmDataToastHandler(handler);
  setDirectionsToastHandler(handler);
};

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
  openShopOverlays: (shop: Shop, openTab?: 'shop' | 'social' | 'directions', socialTab?: string) => void; // --- MODIFIED ---
  closeShopOverlays: () => void;
  isInitialModalOpen: boolean;
  setIsInitialModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mapsApiReady: boolean;
  mapViewTargetLocation: AutocompletePlace | null;
  setMapViewTargetLocation: React.Dispatch<React.SetStateAction<AutocompletePlace | null>>;
  socialOverlayInitialTab: string;
  setSocialOverlayActiveTab: (tab: string) => void;
  tabChangeKey: number;

  // --- API ERROR & LOADING STATES ---
  isLoadingFarmStands: boolean;
  farmStandsError: string | null;
  retryLoadFarmStands: () => void;

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

/**
 * AppProvider wraps children with all domain-specific providers
 * and provides a composite context for backward compatibility
 */
export const AppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AppProviders>
      <AppContextProvider>{children}</AppContextProvider>
    </AppProviders>
  );
};

/**
 * Internal provider that combines all domain contexts into the legacy AppContext
 */
const AppContextProvider = ({ children }: { children: ReactNode }) => {
  // Get all domain-specific contexts
  const farmData = useFarmData();
  const search = useSearch();
  const filters = useFilters();
  const ui = useUI();
  const directions = useDirections();

  // Combine them into the legacy AppContext shape
  const value: AppContextType = useMemo(() => ({
    // FarmData domain
    allFarmStands: farmData.allFarmStands,
    setAllFarmStands: farmData.setAllFarmStands,
    currentlyDisplayedShops: farmData.currentlyDisplayedShops,
    setCurrentlyDisplayedShops: farmData.setCurrentlyDisplayedShops,
    isLoadingFarmStands: farmData.isLoadingFarmStands,
    farmStandsError: farmData.farmStandsError,
    retryLoadFarmStands: farmData.retryLoadFarmStands,

    // Search domain
    lastPlaceSelectedByAutocomplete: search.lastPlaceSelectedByAutocomplete,
    setLastPlaceSelectedByAutocompleteAndCookie: search.setLastPlaceSelectedByAutocompleteAndCookie,
    searchTerm: search.searchTerm,
    setSearchTerm: search.setSearchTerm,
    currentRadius: search.currentRadius,
    setCurrentRadius: search.setCurrentRadius,
    mapsApiReady: search.mapsApiReady,
    mapViewTargetLocation: search.mapViewTargetLocation,
    setMapViewTargetLocation: search.setMapViewTargetLocation,

    // Filter domain
    activeProductFilters: filters.activeProductFilters,
    setActiveProductFilters: filters.setActiveProductFilters,

    // UI domain
    selectedShop: ui.selectedShop,
    setSelectedShop: ui.setSelectedShop,
    isShopOverlayOpen: ui.isShopOverlayOpen,
    isSocialOverlayOpen: ui.isSocialOverlayOpen,
    openShopOverlays: ui.openShopOverlays,
    closeShopOverlays: ui.closeShopOverlays,
    isInitialModalOpen: ui.isInitialModalOpen,
    setIsInitialModalOpen: ui.setIsInitialModalOpen,
    socialOverlayInitialTab: ui.socialOverlayInitialTab,
    setSocialOverlayActiveTab: ui.setSocialOverlayActiveTab,
    tabChangeKey: ui.tabChangeKey,

    // Directions domain
    directionsResult: directions.directionsResult,
    directionsError: directions.directionsError,
    isFetchingDirections: directions.isFetchingDirections,
    fetchAndDisplayDirections: directions.fetchAndDisplayDirections,
    clearDirections: directions.clearDirections,
  }), [farmData, search, filters, ui, directions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};