// src/contexts/FilterContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import { LocationType } from '../types/shop';
import { PRODUCT_CONFIGS } from '../config/products';

interface FilterContextType {
  activeProductFilters: Record<string, boolean>;
  setActiveProductFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeLocationTypes: Set<LocationType>;
  setActiveLocationTypes: React.Dispatch<React.SetStateAction<Set<LocationType>>>;
  toggleLocationType: (type: LocationType) => void;
  toggleFilter: (productKey: string) => void;
  clearAllFilters: () => void;
  isValidProductKey: (key: string) => boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [activeProductFilters, setActiveProductFilters] = useState<Record<string, boolean>>({});

  // Default: all location types selected
  const [activeLocationTypes, setActiveLocationTypes] = useState<Set<LocationType>>(
    new Set<LocationType>([
      'farm_stand',
      'cheese_shop',
      'fish_monger',
      'butcher',
      'antique_shop',
      'brewery',
      'winery',
      'sugar_shack'
    ])
  );

  // Get valid product keys based on active location types
  const validProductKeys = useMemo(() => {
    const keys = new Set<string>();
    activeLocationTypes.forEach(type => {
      const config = PRODUCT_CONFIGS[type];
      Object.keys(config).forEach(key => keys.add(key));
    });
    return keys;
  }, [activeLocationTypes]);

  /**
   * Validates if a given key is a recognized product filter for active location types
   */
  const isValidProductKey = useCallback((key: string): boolean => {
    return validProductKeys.has(key);
  }, [validProductKeys]);

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
   * Clears all active filters and resets location types to all selected
   */
  const clearAllFilters = useCallback(() => {
    setActiveProductFilters({});
    setActiveLocationTypes(new Set<LocationType>([
      'farm_stand',
      'cheese_shop',
      'fish_monger',
      'butcher',
      'antique_shop',
      'brewery',
      'winery',
      'sugar_shack'
    ]));
  }, []);

  // Helper function to toggle a location type on/off
  const toggleLocationType = useMemo(() => (type: LocationType) => {
    setActiveLocationTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        // Don't allow deselecting if it's the only one selected
        if (newSet.size > 1) {
          newSet.delete(type);
        }
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value: FilterContextType = useMemo(() => ({
    activeProductFilters,
    setActiveProductFilters,
    activeLocationTypes,
    setActiveLocationTypes,
    toggleLocationType,
    toggleFilter,
    clearAllFilters,
    isValidProductKey,
  }), [activeProductFilters, activeLocationTypes, toggleLocationType, toggleFilter, clearAllFilters, isValidProductKey]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
