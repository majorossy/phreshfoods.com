// src/contexts/FarmDataContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef, useMemo } from 'react';
import { Shop, ShopWithDistance, ToastType } from '../types';
import * as apiService from '../services/apiService';

interface FarmDataContextType {
  allFarmStands: Shop[];
  setAllFarmStands: React.Dispatch<React.SetStateAction<Shop[]>>;
  currentlyDisplayedShops: ShopWithDistance[];
  setCurrentlyDisplayedShops: React.Dispatch<React.SetStateAction<ShopWithDistance[]>>;
  isLoadingFarmStands: boolean;
  farmStandsError: string | null;
  retryLoadFarmStands: () => void;
}

const FarmDataContext = createContext<FarmDataContextType | undefined>(undefined);

// Toast handler reference (shared across contexts)
let toastHandler: ((type: ToastType, message: string) => void) | null = null;

export const setToastHandler = (handler: (type: ToastType, message: string) => void) => {
  toastHandler = handler;
};

export const FarmDataProvider = ({ children }: { children: ReactNode }) => {
  const [allFarmStands, setAllFarmStands] = useState<Shop[]>([]);
  const [currentlyDisplayedShops, setCurrentlyDisplayedShops] = useState<ShopWithDistance[]>([]);
  const [isLoadingFarmStands, setIsLoadingFarmStands] = useState<boolean>(true);
  const [farmStandsError, setFarmStandsError] = useState<string | null>(null);

  // Use ref instead of state to track loading without triggering re-renders
  const hasLoadedRef = useRef<boolean>(false);

  /**
   * Loads farm stand data from the API with error handling
   */
  const loadFarmStands = useCallback(async (signal?: AbortSignal) => {
    // Prevent duplicate loads
    if (hasLoadedRef.current) {
      return;
    }

    setIsLoadingFarmStands(true);
    setFarmStandsError(null);

    try {
      const fetchedStands = await apiService.fetchAndProcessFarmStands(signal);

      // Don't update state if request was aborted
      if (signal?.aborted) {
        // Reset the loaded flag so the next mount can try again
        hasLoadedRef.current = false;
        return;
      }

      if (fetchedStands && Array.isArray(fetchedStands)) {
        setAllFarmStands(fetchedStands);
        setFarmStandsError(null);
        hasLoadedRef.current = true;
      } else {
        setAllFarmStands([]);
        const errorMsg = 'Failed to load farm stands. Please try again.';
        setFarmStandsError(errorMsg);
        if (toastHandler) {
          toastHandler('error', errorMsg);
        }
      }
    } catch (error) {
      // Don't show error for aborted requests
      if (signal?.aborted) {
        // Reset the loaded flag so the next mount can try again
        hasLoadedRef.current = false;
        return;
      }
      setAllFarmStands([]);
      const errorMsg = 'Unable to load farm data. Please check your connection and try again.';
      setFarmStandsError(errorMsg);
      if (toastHandler) {
        toastHandler('error', errorMsg);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoadingFarmStands(false);
      }
    }
  }, []);

  // Load farm stands on mount (only once) with abort support
  useEffect(() => {
    const abortController = new AbortController();
    loadFarmStands(abortController.signal);

    // Cleanup: abort request if component unmounts
    return () => {
      abortController.abort();
    };
  }, [loadFarmStands]); // Include loadFarmStands in deps - it's stable from useCallback

  // Retry function that resets the loaded flag
  const retryLoadFarmStands = useCallback(() => {
    hasLoadedRef.current = false;
    loadFarmStands();
  }, [loadFarmStands]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: FarmDataContextType = useMemo(() => ({
    allFarmStands,
    setAllFarmStands,
    currentlyDisplayedShops,
    setCurrentlyDisplayedShops,
    isLoadingFarmStands,
    farmStandsError,
    retryLoadFarmStands,
  }), [allFarmStands, currentlyDisplayedShops, isLoadingFarmStands, farmStandsError, retryLoadFarmStands]);

  return <FarmDataContext.Provider value={value}>{children}</FarmDataContext.Provider>;
};

export const useFarmData = () => {
  const context = useContext(FarmDataContext);
  if (context === undefined) {
    throw new Error('useFarmData must be used within a FarmDataProvider');
  }
  return context;
};
