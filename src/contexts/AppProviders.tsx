// src/contexts/AppProviders.tsx
import React, { ReactNode } from 'react';
import { ToastProvider } from './ToastContext';
import { LocationDataProvider } from './LocationDataContext';
import { SearchProvider } from './SearchContext';
import { FilterProvider } from './FilterContext';
import { UIProvider } from './UIContext';
import { DirectionsProvider } from './DirectionsContext';
import { TripPlannerProvider } from './TripPlannerContext';

/**
 * Composite provider that wraps all domain-specific contexts
 *
 * This allows components to use individual contexts (e.g., useLocationData, useSearch)
 * or the legacy AppContext hook which combines all contexts
 *
 * NOTE: ToastProvider must be the outermost provider so other contexts can use useToast()
 */
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ToastProvider>
      <LocationDataProvider>
        <SearchProvider>
          <FilterProvider>
            <UIProvider>
              <DirectionsProvider>
                <TripPlannerProvider>
                  {children}
                </TripPlannerProvider>
              </DirectionsProvider>
            </UIProvider>
          </FilterProvider>
        </SearchProvider>
      </LocationDataProvider>
    </ToastProvider>
  );
};
