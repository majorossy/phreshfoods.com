// src/contexts/FarmDataContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
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
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  /**
   * Loads farm stand data from the API with error handling
   */
  const loadFarmStands = useCallback(async () => {
    setIsLoadingFarmStands(true);
    setFarmStandsError(null);

    try {
      const fetchedStands = await apiService.fetchAndProcessFarmStands();
      if (fetchedStands && Array.isArray(fetchedStands)) {
        setAllFarmStands(fetchedStands);
        setFarmStandsError(null);
        setHasLoaded(true);
      } else {
        setAllFarmStands([]);
        const errorMsg = 'Failed to load farm stands. Please try again.';
        setFarmStandsError(errorMsg);
        if (toastHandler) {
          toastHandler('error', errorMsg);
        }
      }
    } catch (error) {
      console.error("[FarmDataContext] Error fetching farm stands:", error);
      setAllFarmStands([]);
      const errorMsg = 'Unable to load farm data. Please check your connection and try again.';
      setFarmStandsError(errorMsg);
      if (toastHandler) {
        toastHandler('error', errorMsg);
      }
    } finally {
      setIsLoadingFarmStands(false);
    }
  }, []);

  // Load farm stands on mount (only once)
  useEffect(() => {
    if (!hasLoaded) {
      loadFarmStands();
    }
  }, []); // Empty dependency array - only run once on mount

  const value: FarmDataContextType = {
    allFarmStands,
    setAllFarmStands,
    currentlyDisplayedShops,
    setCurrentlyDisplayedShops,
    isLoadingFarmStands,
    farmStandsError,
    retryLoadFarmStands: loadFarmStands,
  };

  return <FarmDataContext.Provider value={value}>{children}</FarmDataContext.Provider>;
};

export const useFarmData = () => {
  const context = useContext(FarmDataContext);
  if (context === undefined) {
    throw new Error('useFarmData must be used within a FarmDataProvider');
  }
  return context;
};
