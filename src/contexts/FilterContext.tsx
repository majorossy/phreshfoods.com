// src/contexts/FilterContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import { PRODUCT_ICONS_CONFIG } from '../config/appConfig';

interface FilterContextType {
  activeProductFilters: Record<string, boolean>;
  setActiveProductFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  toggleFilter: (productKey: string) => void;
  clearAllFilters: () => void;
  isValidProductKey: (key: string) => boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Get valid product keys from config
const VALID_PRODUCT_KEYS = new Set(Object.keys(PRODUCT_ICONS_CONFIG));

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [activeProductFilters, setActiveProductFilters] = useState<Record<string, boolean>>({});

  /**
   * Validates if a given key is a recognized product filter
   */
  const isValidProductKey = useCallback((key: string): boolean => {
    return VALID_PRODUCT_KEYS.has(key);
  }, []);

  /**
   * Toggles a product filter on/off with validation
   */
  const toggleFilter = useCallback((productKey: string) => {
    if (!isValidProductKey(productKey)) {
      if (import.meta.env.DEV) {
        console.warn(`[FilterContext] Attempted to toggle invalid product key: "${productKey}"`);
      }
      return;
    }

    setActiveProductFilters(prev => ({
      ...prev,
      [productKey]: !prev[productKey]
    }));
  }, [isValidProductKey]);

  /**
   * Clears all active filters
   */
  const clearAllFilters = useCallback(() => {
    setActiveProductFilters({});
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value: FilterContextType = useMemo(() => ({
    activeProductFilters,
    setActiveProductFilters,
    toggleFilter,
    clearAllFilters,
    isValidProductKey,
  }), [activeProductFilters, toggleFilter, clearAllFilters, isValidProductKey]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
