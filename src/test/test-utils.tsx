// src/test/test-utils.tsx
// Custom testing utilities that make testing components with contexts easier

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '../contexts/AppProviders';

/**
 * WHAT IS THIS FILE?
 * ------------------
 * This file provides a custom `render` function that wraps components with
 * all the context providers they need (SearchContext, FilterContext, etc.)
 *
 * WHY DO WE NEED IT?
 * ------------------
 * Most of our components use contexts (useSearch, useFilters, useUI, etc.)
 * Without providers, these components will crash with "useSearch must be used within a SearchProvider"
 *
 * Instead of wrapping EVERY test with providers manually:
 *   render(
 *     <SearchProvider>
 *       <FilterProvider>
 *         <UIProvider>
 *           <Header />
 *         </UIProvider>
 *       </FilterProvider>
 *     </SearchProvider>
 *   )
 *
 * We can just use:
 *   render(<Header />, { wrapper: AllProviders })
 *
 * Even better, we export a custom renderWithProviders that does this automatically!
 */

/**
 * AllProviders - Wraps components with all context providers
 *
 * This includes:
 * - BrowserRouter (for navigation/routing)
 * - AppProviders (all your domain contexts: FarmData, Search, Filter, UI, Directions, Toast)
 */
interface AllProvidersProps {
  children: React.ReactNode;
}

export function AllProviders({ children }: AllProvidersProps) {
  return (
    <BrowserRouter>
      <AppProviders>
        {children}
      </AppProviders>
    </BrowserRouter>
  );
}

/**
 * Custom render function with all providers automatically included
 *
 * Usage:
 *   renderWithProviders(<Header />)
 *
 * This is equivalent to:
 *   render(<Header />, { wrapper: AllProviders })
 *
 * @param ui - The component to render
 * @param options - Optional render options
 * @returns Render result from @testing-library/react
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Re-export everything from @testing-library/react
 * This allows you to import everything from one place:
 *
 *   import { renderWithProviders, screen, waitFor } from './test-utils'
 *
 * Instead of:
 *   import { renderWithProviders } from './test-utils'
 *   import { screen, waitFor } from '@testing-library/react'
 */
export * from '@testing-library/react';

/**
 * EXAMPLE USAGE IN TESTS:
 * ------------------------
 *
 * import { renderWithProviders, screen } from '../test/test-utils';
 * import { Header } from './Header';
 *
 * it('renders search input', () => {
 *   renderWithProviders(<Header />);
 *   expect(screen.getByPlaceholderText(/enter a zip/i)).toBeInTheDocument();
 * });
 */
