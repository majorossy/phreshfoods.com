// src/contexts/FilterContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useParams, useLocation, useNavigate } from 'react-router-dom';
import type { LocationType } from '../types/shop';
import { ENABLED_LOCATION_TYPES } from '../config/enabledLocationTypes';
import { PRODUCT_CONFIGS } from '../config/products';
import { parseFiltersFromURL } from '../utils/urlSync';
import { parseTypesFromPath } from '../utils/typeUrlMappings';

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

// Default active location types (only enabled types selected)
const DEFAULT_ACTIVE_LOCATION_TYPES = new Set<LocationType>(ENABLED_LOCATION_TYPES);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams] = useSearchParams();
  const { types } = useParams<{ types?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeProductFilters, setActiveProductFilters] = useState<Record<string, boolean>>({});

  // Default: all location types selected
  const [activeLocationTypes, setActiveLocationTypes] = useState<Set<LocationType>>(
    new Set(DEFAULT_ACTIVE_LOCATION_TYPES)
  );

  // Initialize from URL on mount
  // Priority: Path params > Query params > Default (all types)
  useEffect(() => {
    // 1. Parse location types from URL path (highest priority)
    let locationTypesFromUrl: Set<LocationType>;

    if (types) {
      // Types from path param (e.g., /farms or /farms+cheese)
      locationTypesFromUrl = parseTypesFromPath(types);
    } else if (location.pathname === '/all' || location.pathname === '/') {
      // /all and / should have ALL enabled location types selected
      locationTypesFromUrl = new Set<LocationType>(ENABLED_LOCATION_TYPES);
    } else if (location.pathname === '/not-sure') {
      // /not-sure should have NO location types (empty state)
      locationTypesFromUrl = new Set<LocationType>();
    } else {
      // Fallback: Try to parse from query params (backward compatibility)
      const urlState = parseFiltersFromURL(searchParams);
      locationTypesFromUrl = urlState.locationTypes;
    }

    setActiveLocationTypes(locationTypesFromUrl);

    // 2. Initialize product filters from URL query params
    const urlState = parseFiltersFromURL(searchParams);
    const validProducts = Object.keys(urlState.productFilters).filter(key => {
      // Check if product key exists in any of the active location types
      let isValid = false;
      locationTypesFromUrl.forEach(type => {
        if (PRODUCT_CONFIGS[type]?.[key]) {
          isValid = true;
        }
      });
      return isValid && urlState.productFilters[key];
    });

    const validProductFilters: Record<string, boolean> = {};
    validProducts.forEach(key => {
      validProductFilters[key] = true;
    });

    setActiveProductFilters(validProductFilters);

    // Note: Search location and radius are handled by SearchContext
  }, []); // Empty dependency array = run only on mount

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
   * ONLY navigates to /all - FilterContext URL initialization handles state updates
   * This prevents race conditions with useURLSync
   */
  const clearAllFilters = useCallback(() => {
    // Preserve search location query params (lat, lng, location, radius)
    const currentParams = new URLSearchParams(window.location.search);
    const searchParams = new URLSearchParams();

    // Keep location-related params, remove product filters
    ['lat', 'lng', 'location', 'radius'].forEach(key => {
      const value = currentParams.get(key);
      if (value) searchParams.set(key, value);
    });

    const queryString = searchParams.toString();
    const newUrl = queryString ? `/all?${queryString}` : '/all';

    // Update state IMMEDIATELY to prevent useURLSync from seeing empty state
    setActiveProductFilters({});
    setActiveLocationTypes(new Set(DEFAULT_ACTIVE_LOCATION_TYPES));

    // Then navigate
    navigate(newUrl, { replace: true });
  }, [navigate]);

  // Helper function to toggle a location type on/off
  const toggleLocationType = useCallback((type: LocationType) => {
    setActiveLocationTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        // Allow unchecking the last type to reach empty state (→ /not-sure)
        newSet.delete(type);
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
