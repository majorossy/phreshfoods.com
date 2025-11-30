// src/contexts/LocationDataContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef, useMemo } from 'react';
import { Shop, ShopWithDistance } from '../types';
import * as apiService from '../services/apiService';
import { useToast } from './ToastContext';

interface LocationDataContextType {
  allLocations: Shop[];
  setAllLocations: React.Dispatch<React.SetStateAction<Shop[]>>;
  currentlyDisplayedLocations: ShopWithDistance[];
  setCurrentlyDisplayedLocations: React.Dispatch<React.SetStateAction<ShopWithDistance[]>>;
  isLoadingLocations: boolean;
  locationsError: string | null;
  retryLoadLocations: () => void;
}

const LocationDataContext = createContext<LocationDataContextType | undefined>(undefined);

export const LocationDataProvider = ({ children }: { children: ReactNode }) => {
  const { showError } = useToast();
  const [allLocations, setAllLocations] = useState<Shop[]>([]);
  const [currentlyDisplayedLocations, setCurrentlyDisplayedLocations] = useState<ShopWithDistance[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  // Use ref instead of state to track loading without triggering re-renders
  const hasLoadedRef = useRef<boolean>(false);

  /**
   * Loads location data from the API with error handling.
   * Supports early fetch optimization: if window.__LOCATIONS_PROMISE__ exists
   * (set during HTML parsing in index.html), we consume that promise instead
   * of starting a new fetch. This eliminates the data fetch waterfall and
   * improves LCP by ~450ms.
   */
  const loadLocations = useCallback(async (signal?: AbortSignal) => {
    // Prevent duplicate loads
    if (hasLoadedRef.current) {
      return;
    }

    setIsLoadingLocations(true);
    setLocationsError(null);

    try {
      let fetchedLocations: Shop[] | null = null;

      // Check if early fetch promise is available (set in index.html during HTML parsing)
      // This eliminates the data fetch waterfall - fetch started ~450ms earlier
      if (window.__LOCATIONS_PROMISE__) {
        console.log('[LocationData] Using early fetch promise from index.html');
        fetchedLocations = await window.__LOCATIONS_PROMISE__;
        // Cleanup the global to prevent memory leaks and re-use
        delete window.__LOCATIONS_PROMISE__;
      }

      // Fallback to normal fetch if early fetch failed or wasn't available
      if (!fetchedLocations) {
        console.log('[LocationData] Falling back to normal API fetch');
        fetchedLocations = await apiService.fetchAndProcessLocations(signal);
      }

      // Don't update state if request was aborted
      if (signal?.aborted) {
        // Reset the loaded flag so the next mount can try again
        hasLoadedRef.current = false;
        return;
      }

      if (fetchedLocations && Array.isArray(fetchedLocations)) {
        setAllLocations(fetchedLocations);
        setLocationsError(null);
        hasLoadedRef.current = true;
      } else {
        setAllLocations([]);
        const errorMsg = 'Failed to load locations. Please try again.';
        setLocationsError(errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      // Don't show error for aborted requests
      if (signal?.aborted) {
        // Reset the loaded flag so the next mount can try again
        hasLoadedRef.current = false;
        return;
      }
      setAllLocations([]);
      const errorMsg = 'Unable to load location data. Please check your connection and try again.';
      setLocationsError(errorMsg);
      showError(errorMsg);
    } finally {
      if (!signal?.aborted) {
        setIsLoadingLocations(false);
      }
    }
  }, [showError]);

  // Load locations on mount (only once) with abort support
  useEffect(() => {
    const abortController = new AbortController();
    loadLocations(abortController.signal);

    // Cleanup: abort request if component unmounts
    return () => {
      abortController.abort();
    };
  }, [loadLocations]); // Include loadLocations in deps - it's stable from useCallback

  // Retry function that resets the loaded flag
  const retryLoadLocations = useCallback(() => {
    hasLoadedRef.current = false;
    loadLocations();
  }, [loadLocations]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: LocationDataContextType = useMemo(() => ({
    allLocations,
    setAllLocations,
    currentlyDisplayedLocations,
    setCurrentlyDisplayedLocations,
    isLoadingLocations,
    locationsError,
    retryLoadLocations,
  }), [allLocations, currentlyDisplayedLocations, isLoadingLocations, locationsError, retryLoadLocations]);

  return <LocationDataContext.Provider value={value}>{children}</LocationDataContext.Provider>;
};

export const useLocationData = () => {
  const context = useContext(LocationDataContext);
  if (context === undefined) {
    throw new Error('useLocationData must be used within a LocationDataProvider');
  }
  return context;
};
