// src/hooks/useURLSync.ts
import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useFilters } from '../contexts/FilterContext';
import { useSearch } from '../contexts/SearchContext';
import { ENABLED_LOCATION_TYPES } from '../config/enabledLocationTypes';
import {
  encodeFiltersToURL,
  URLFilterState,
} from '../utils/urlSync';
import { encodeTypesToPath } from '../utils/typeUrlMappings';

/**
 * Custom hook to sync filter/search state to URL parameters
 *
 * Features:
 * - Debounces updates by 300ms to prevent URL thrashing
 * - Uses smart comparison to skip unnecessary updates
 * - Uses replace: true for filter changes to avoid polluting browser history
 * - Skips URL updates when on direct farm detail pages (/farm/:slug)
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useURLSync(); // Just call it, no return value
 *   // ...
 * }
 * ```
 */
export function useURLSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get current filter and search state from contexts
  const { activeProductFilters, activeLocationTypes } = useFilters();
  const { lastPlaceSelectedByAutocomplete, currentRadius } = useSearch();

  // Timeout ref for debouncing
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track if this is the initial mount
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip URL sync on initial mount (contexts already read from URL)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip URL updates on shop detail pages (e.g., /farm/slug, /cheese/slug)
    // Detail pages have two path segments: /farm/slug, /cheese/slug, etc.
    if (location.pathname.includes('/') && location.pathname.split('/').filter(Boolean).length >= 2) {
      return;
    }

    // Skip URL sync when on /all ONLY if in clear state (all types, no filters)
    // This prevents flash when clicking logo, but allows filter application
    if (location.pathname === '/all') {
      const hasActiveFilters = Object.values(activeProductFilters).some(v => v === true);
      const isAllLocationTypesSelected = activeLocationTypes.size === ENABLED_LOCATION_TYPES.length;

      // Only skip URL sync when we're in the "clear" state
      if (isAllLocationTypesSelected && !hasActiveFilters) {
        return; // Stay on /all - already in correct clear state
      }
      // If user has filters or non-all types, allow URL sync to navigate away
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce URL updates by 300ms
    timeoutRef.current = setTimeout(() => {
      // 1. Encode location types to path
      const typesPath = encodeTypesToPath(activeLocationTypes);

      // 2. Build current filter state from context values (for query params only)
      const currentState: URLFilterState = {
        locationTypes: activeLocationTypes, // Not used in query params anymore
        productFilters: activeProductFilters,
        searchLocation: lastPlaceSelectedByAutocomplete,
        searchRadius: currentRadius,
      };

      // 3. Encode query parameters (products, location, lat, lng, radius)
      const queryParams = encodeFiltersToURL(currentState);
      const queryString = queryParams.toString();

      // 4. Build the new URL
      const hasActiveFilters = Object.values(activeProductFilters).some(v => v === true);
      const isAllLocationTypesSelected = activeLocationTypes.size === ENABLED_LOCATION_TYPES.length;
      const hasNoLocationTypes = activeLocationTypes.size === 0;

      let newUrl: string;

      // EMPTY FILTERS: No location types selected → /not-sure
      if (hasNoLocationTypes) {
        newUrl = '/not-sure';
      }
      // CLEAR FILTERS: All types + no products → /all
      else if (isAllLocationTypesSelected && !hasActiveFilters) {
        newUrl = '/all';
      }
      // FILTERED: Specific types or products selected → encoded path
      else {
        newUrl = typesPath ? `/${typesPath}` : '/all';
      }

      if (queryString) {
        newUrl += `?${queryString}`;
      }

      // 5. Only navigate if URL actually changed
      const currentUrl = `${location.pathname}${location.search}`;
      if (newUrl !== currentUrl) {
        // Use replace: true to avoid polluting browser history
        navigate(newUrl, { replace: true });
      }
    }, 300); // 300ms debounce

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    activeProductFilters,
    activeLocationTypes,
    lastPlaceSelectedByAutocomplete,
    currentRadius,
    navigate,
    searchParams,
    location.pathname,
  ]);

  // No return value - this hook just manages side effects
}
