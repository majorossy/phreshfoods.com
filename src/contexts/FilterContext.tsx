// src/contexts/FilterContext.tsx
import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { LocationType } from '../types/shop';

interface FilterContextType {
  activeProductFilters: Record<string, boolean>;
  setActiveProductFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeLocationTypes: Set<LocationType>;
  setActiveLocationTypes: React.Dispatch<React.SetStateAction<Set<LocationType>>>;
  toggleLocationType: (type: LocationType) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [activeProductFilters, setActiveProductFilters] = useState<Record<string, boolean>>({});

  // Default: both location types selected
  const [activeLocationTypes, setActiveLocationTypes] = useState<Set<LocationType>>(
    new Set<LocationType>(['farm_stand', 'cheese_shop'])
  );

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
  }), [activeProductFilters, activeLocationTypes, toggleLocationType]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
