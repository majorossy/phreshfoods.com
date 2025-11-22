// src/contexts/AppProviders.tsx
import React, { ReactNode } from 'react';
import { ToastProvider } from './ToastContext';
import { FarmDataProvider } from './FarmDataContext';
import { SearchProvider } from './SearchContext';
import { FilterProvider } from './FilterContext';
import { UIProvider } from './UIContext';
import { DirectionsProvider } from './DirectionsContext';

/**
 * Composite provider that wraps all domain-specific contexts
 *
 * This allows components to use individual contexts (e.g., useFarmData, useSearch)
 * or the legacy AppContext hook which combines all contexts
 *
 * NOTE: ToastProvider must be the outermost provider so other contexts can use useToast()
 */
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ToastProvider>
      <FarmDataProvider>
        <SearchProvider>
          <FilterProvider>
            <UIProvider>
              <DirectionsProvider>
                {children}
              </DirectionsProvider>
            </UIProvider>
          </FilterProvider>
        </SearchProvider>
      </FarmDataProvider>
    </ToastProvider>
  );
};
