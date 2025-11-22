// src/contexts/FilterContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface FilterContextType {
  activeProductFilters: Record<string, boolean>;
  setActiveProductFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [activeProductFilters, setActiveProductFilters] = useState<Record<string, boolean>>({});

  const value: FilterContextType = {
    activeProductFilters,
    setActiveProductFilters,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
