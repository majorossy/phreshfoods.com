// src/components/Header/Header.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AutocompletePlace } from '../../types';
import {
  MAINE_BOUNDS_LITERAL,
  DEFAULT_SEARCH_RADIUS_MILES,
  RADIUS_SLIDER_MIN_MILES,
  RADIUS_SLIDER_MAX_MILES,
  RADIUS_SLIDER_STEP_MILES,
  RADIUS_DEBOUNCE_MS,
} from '../../config/appConfig';
import { Link, useNavigate } from 'react-router-dom';
import ProductFilterDropdown from '../Filters/ProductFilterDropdown';
import { useDebounce } from '../../hooks/useDebounce';
import { useHeaderCollapse } from '../../hooks/useHeaderCollapse';
import { useSearch } from '../../contexts/SearchContext';
import { useUI } from '../../contexts/UIContext';
import { useFilters } from '../../contexts/FilterContext';
import { LocationType } from '../../types/shop';
import { getProductConfig } from '../../config/productRegistry';
import { getDisplayName, getEmoji } from '../../utils/typeUrlMappings';
import { ENABLED_LOCATION_TYPES } from '../../config/enabledLocationTypes';

// Location type UI configurations (color and disabled state)
// Display names and emojis come from centralized config
const LOCATION_TYPE_CONFIG: Record<LocationType, { emoji: string; label: string; color: string; disabled?: boolean }> = {
  farm_stand: { emoji: getEmoji('farm_stand'), label: getDisplayName('farm_stand'), color: 'green' },
  fish_monger: { emoji: getEmoji('fish_monger'), label: getDisplayName('fish_monger'), color: 'blue' },
  cheese_shop: { emoji: getEmoji('cheese_shop'), label: getDisplayName('cheese_shop'), color: 'yellow' },
  butcher: { emoji: getEmoji('butcher'), label: getDisplayName('butcher'), color: 'red' },
  brewery: { emoji: getEmoji('brewery'), label: getDisplayName('brewery'), color: 'amber' },
  winery: { emoji: getEmoji('winery'), label: getDisplayName('winery'), color: 'purple' },
  antique_shop: { emoji: getEmoji('antique_shop'), label: getDisplayName('antique_shop'), color: 'gray' },
  sugar_shack: { emoji: getEmoji('sugar_shack'), label: getDisplayName('sugar_shack'), color: 'orange' },
};

const Header: React.FC = () => {
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const navigate = useNavigate(); // Used by handleTitleClick

  // Product filter dropdowns for location types
  const [openLocationTypeDropdown, setOpenLocationTypeDropdown] = useState<LocationType | null>(null);
  const locationTypeButtonRefs = useRef<Record<LocationType, React.RefObject<HTMLButtonElement>>>({});

  // Local state for radius slider (for immediate UI feedback)
  const [localRadius, setLocalRadius] = useState<number>(DEFAULT_SEARCH_RADIUS_MILES);
  // Debounced radius value (delays filter computation)
  const debouncedRadius = useDebounce(localRadius, RADIUS_DEBOUNCE_MS);

  // Header collapse on mobile (Phase 3)
  const { isCollapsed, sentinelRef } = useHeaderCollapse();

  // Mobile drawer state (hamburger menu) - now managed in UIContext
  const [shouldRenderDrawer, setShouldRenderDrawer] = useState(false);
  const [isDrawerAnimatedOpen, setIsDrawerAnimatedOpen] = useState(false);
  const [openDrawerAccordions, setOpenDrawerAccordions] = useState<Set<LocationType>>(new Set());
  const drawerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get search and UI contexts
  const {
    mapsApiReady,
    setLastPlaceSelectedByAutocompleteAndCookie,
    searchTerm,
    setSearchTerm,
    setMapViewTargetLocation,
    currentRadius,
    setCurrentRadius,
    lastPlaceSelectedByAutocomplete,
    mapViewTargetLocation,
  } = useSearch();

  const {
    setSelectedShop,    // For handleTitleClick
    closeShopOverlays, // For handleTitleClick
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
  } = useUI();

  const {
    activeLocationTypes,
    toggleLocationType,
    activeProductFilters,
    toggleFilter,
    clearAllFilters,
  } = useFilters();

  // Effect to initialize local radius from context
  // We include currentRadius in deps to ensure local state syncs with context changes
  useEffect(() => {
    setLocalRadius(currentRadius);
  }, [currentRadius]);

  // Effect to update context radius when debounced value changes
  // Only update if we're on mobile/tablet (< lg), otherwise MapSearchControls handles it
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      return; // Skip on desktop - MapSearchControls handles radius updates
    }

    if (setCurrentRadius && debouncedRadius !== currentRadius) {
      setCurrentRadius(debouncedRadius);
    }
  }, [debouncedRadius, currentRadius, setCurrentRadius]);

  // Effect to initialize/update inputValue
  // Always display the address of the current map center (radius pin location)
  useEffect(() => {
    // Priority 1: Use mapViewTargetLocation (current center pin) if available
    if (mapViewTargetLocation?.formatted_address) {
      setInputValue(mapViewTargetLocation.formatted_address);
    }
    // Priority 2: Fall back to lastPlaceSelectedByAutocomplete
    else if (lastPlaceSelectedByAutocomplete?.formatted_address) {
      setInputValue(lastPlaceSelectedByAutocomplete.formatted_address);
    }
    // Priority 3: Fall back to searchTerm
    else if (searchTerm) {
      setInputValue(searchTerm);
    }
  }, [mapViewTargetLocation, lastPlaceSelectedByAutocomplete, searchTerm]);

  // Effect for Autocomplete Initialization
  useEffect(() => {
    // Cleanup any existing instance first (handles re-renders and StrictMode)
    if (autocompleteInstanceRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
      autocompleteInstanceRef.current = null;
    }

    // Only initialize if Maps API is ready and we have a valid input element
    if (!mapsApiReady || !autocompleteInputRef.current || !window.google?.maps?.places) {
      return;
    }

    // Verify the input element is still in the DOM
    if (!document.contains(autocompleteInputRef.current)) {
      return;
    }

    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'us' },
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components', 'types'],
    };
    if (MAINE_BOUNDS_LITERAL) {
        const bounds = new google.maps.LatLngBounds(
            {lat: MAINE_BOUNDS_LITERAL.south, lng: MAINE_BOUNDS_LITERAL.west},
            {lat: MAINE_BOUNDS_LITERAL.north, lng: MAINE_BOUNDS_LITERAL.east}
        );
        autocompleteOptions.bounds = bounds;
        autocompleteOptions.strictBounds = false;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, autocompleteOptions);
      autocompleteInstanceRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const placeResult = autocomplete.getPlace();
        if (placeResult.geometry && placeResult.geometry.location) {
          const adaptedPlace: AutocompletePlace = {
            name: placeResult.name,
            formatted_address: placeResult.formatted_address,
            geometry: {
              location: { lat: placeResult.geometry.location.lat(), lng: placeResult.geometry.location.lng() },
              viewport: placeResult.geometry.viewport?.toJSON(),
            },
            place_id: placeResult.place_id, address_components: placeResult.address_components, types: placeResult.types,
          };
          const term = placeResult.formatted_address || placeResult.name || "";
          setInputValue(term);
          setLastPlaceSelectedByAutocompleteAndCookie(adaptedPlace, term);
          setSearchTerm(term);
          setMapViewTargetLocation(adaptedPlace);

          // Navigate to homepage and close all overlays when new address is selected
          navigate('/', { replace: true });
          closeShopOverlays();
        } else {
          const currentInputVal = autocompleteInputRef.current?.value || "";
          setSearchTerm(currentInputVal);
          setLastPlaceSelectedByAutocompleteAndCookie(null, currentInputVal);
        }
      });
    } catch (error) {
      autocompleteInstanceRef.current = null;
    }

    return () => {
        if (autocompleteInstanceRef.current) {
            try {
              google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
            } catch (error) {
              // Cleanup error, silently continue
            }
            // Clean up pac-container elements
            const pacContainers = document.getElementsByClassName('pac-container');
            for (let i = pacContainers.length - 1; i >= 0; i--) {
                const container = pacContainers[i];
                if(container.parentNode) {
                  try {
                    container.parentNode.removeChild(container);
                  } catch (error) {
                    // Element might already be removed
                  }
                }
            }
            autocompleteInstanceRef.current = null;
        }
    };
  }, [mapsApiReady, setLastPlaceSelectedByAutocompleteAndCookie, setSearchTerm, setMapViewTargetLocation, navigate, closeShopOverlays]);

  // Drawer animation effects (delayed mount/unmount pattern)
  useEffect(() => {
    if (isFilterDrawerOpen) {
      if (drawerTimeoutRef.current) {
        clearTimeout(drawerTimeoutRef.current);
      }
      setShouldRenderDrawer(true);
    } else if (shouldRenderDrawer) {
      drawerTimeoutRef.current = setTimeout(() => {
        setShouldRenderDrawer(false);
      }, 350);
    }

    return () => {
      if (drawerTimeoutRef.current) {
        clearTimeout(drawerTimeoutRef.current);
      }
    };
  }, [isFilterDrawerOpen, shouldRenderDrawer]);

  // Delayed enter animation (RAF pattern)
  useEffect(() => {
    if (isFilterDrawerOpen && shouldRenderDrawer) {
      const rafId = requestAnimationFrame(() => {
        setIsDrawerAnimatedOpen(true);
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsDrawerAnimatedOpen(false);
    }
  }, [isFilterDrawerOpen, shouldRenderDrawer]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    /* ... your existing blur logic ... */
  }, []);

  const handleInputKeyDown = useCallback((_event: React.KeyboardEvent<HTMLInputElement>) => {
    /* ... your existing keydown logic ... */
  }, []);

  const handleTitleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link's default navigation
    setSelectedShop(null);
    closeShopOverlays();
    clearAllFilters(); // Reset all filters (navigates to /all with query params)
    // Keep current search location/radius - don't reset
  }, [setSelectedShop, closeShopOverlays, clearAllFilters]);

  // Mobile drawer toggle handlers
  const toggleDrawer = useCallback(() => {
    setIsFilterDrawerOpen(!isFilterDrawerOpen);
  }, [isFilterDrawerOpen, setIsFilterDrawerOpen]);

  const closeDrawer = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, [setIsFilterDrawerOpen]);

  // Escape key closes drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFilterDrawerOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFilterDrawerOpen, closeDrawer]);

  // Toggle accordion in drawer
  const toggleDrawerAccordion = useCallback((type: LocationType) => {
    setOpenDrawerAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  }, []);

  return (
    <header
      className={`
        absolute top-0 left-0 right-0 z-30 print:hidden
        transition-all duration-300 ease-out
        ${isCollapsed ? 'md:py-2' : ''}
      `}
      style={{
        // Mobile-only collapsible behavior
        height: isCollapsed ? '3.5rem' : 'auto', // 56px collapsed on mobile
      }}
      role="banner"
    >
      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} className="absolute top-0 h-0 w-0 pointer-events-none" aria-hidden="true" />

      {/* ========== MOBILE COLLAPSED BAR ========== */}
      <div className="md:hidden w-full px-3 py-2">
        <div className="flex items-center gap-3">
          {/* Logo as Hamburger Menu */}
          <button
            onClick={toggleDrawer}
            className="cursor-pointer transition-transform duration-300 hover:scale-110 flex-shrink-0"
            aria-label={isFilterDrawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={isFilterDrawerOpen}
          >
            <img
              src="/images/logo.png"
              alt="Maine Flag"
              className="h-8 w-auto object-contain logo-hamburger drop-shadow-lg"
            />
          </button>

          {/* Search Input (always visible) */}
          <label htmlFor="headerSearchMobile" className="sr-only">Search for locations</label>
          <input
            ref={autocompleteInputRef}
            id="headerSearchMobile"
            type="text"
            placeholder="Search location..."
            className="flex-1 px-3 py-2 rounded-lg shadow-md bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800/90 dark:text-white border-0"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            aria-label="Search by zip, city, or address"
          />
        </div>
      </div>

      {/* ========== DESKTOP HEADER (UNCHANGED) ========== */}
      <div className="hidden md:block w-full">
        <div className={`
          flex flex-col sm:flex-row justify-between items-center py-2 gap-y-2 gap-x-4 w-full px-3 sm:px-4
          transition-opacity duration-300
          ${isCollapsed ? 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'opacity-100'}
        `}>
          {/* Combined Container: Logo, Type Filters, Search, Radius, and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2 px-5 py-3 rounded-2xl flex-wrap" style={{ backgroundColor: '#356A78' }} role="search" aria-label="Search and filter locations">
            {/* Logo Section */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/all"
                onClick={handleTitleClick}
                className="cursor-pointer transition-all duration-300 hover:scale-110 hover:-rotate-2 hover:drop-shadow-xl"
                style={{ transformStyle: 'preserve-3d' }}
                title="Reset Filters"
                aria-label="Reset Filters"
              >
                <img src="/images/logo.png" alt="Maine Flag" className="h-8 sm:h-10 w-auto object-contain"/>
              </Link>
            </div>

            {/* Type Filter Buttons with Dropdowns */}
            <div className="flex items-center gap-3 flex-wrap" role="group" aria-label="Location type filters">
              <div className="flex items-center gap-1.5 flex-wrap">
              {(Object.entries(LOCATION_TYPE_CONFIG) as [LocationType, typeof LOCATION_TYPE_CONFIG[LocationType]][])
                .filter(([type]) => ENABLED_LOCATION_TYPES.includes(type))
                .map(([type, config]) => {
                const isActive = activeLocationTypes.has(type);
                const isOpen = openLocationTypeDropdown === type;
                const isDisabled = config.disabled === true;

                // Create ref if it doesn't exist
                if (!locationTypeButtonRefs.current[type]) {
                  locationTypeButtonRefs.current[type] = React.createRef<HTMLButtonElement>();
                }

                const colorClasses = {
                  green: isActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-green-200 hover:text-black border border-green-400',
                  yellow: isActive
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-yellow-200 hover:text-black border border-yellow-400',
                  blue: isActive
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-blue-200 hover:text-black border border-blue-400',
                  red: isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-red-200 hover:text-black border border-red-400',
                  purple: isActive
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-purple-200 hover:text-black border border-purple-400',
                  amber: isActive
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-amber-200 hover:text-black border border-amber-400',
                  rose: isActive
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-rose-200 hover:text-black border border-rose-400',
                  orange: isActive
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-orange-200 hover:text-black border border-orange-400',
                  teal: isActive
                    ? 'bg-teal-100 text-teal-700 hover:bg-teal-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-teal-200 hover:text-black border border-teal-400',
                  gray: isActive
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-400 hover:text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-black border border-gray-400',
                };

                // Disabled styling - gray, low opacity, no hover effects
                const buttonClasses = isDisabled
                  ? 'bg-gray-200 text-gray-500 opacity-50 cursor-not-allowed'
                  : colorClasses[config.color];

                return (
                  <div key={type} className="relative">
                    <div className={`flex items-center rounded-full overflow-hidden transition-all duration-200 ${buttonClasses}`}>
                      {/* Main button - toggles location type filter */}
                      <button
                        type="button"
                        onClick={() => !isDisabled && toggleLocationType(type)}
                        disabled={isDisabled}
                        className="text-xs pl-2 pr-1 py-0.5 font-medium whitespace-nowrap flex items-center gap-1 flex-shrink-0 transition-all duration-200"
                        title={isDisabled ? `${config.label} (Coming Soon)` : `${isActive ? 'Hide' : 'Show'} ${config.label}`}
                        aria-label={isDisabled ? `${config.label} (Coming Soon)` : `${isActive ? 'Hide' : 'Show'} ${config.label} locations`}
                        aria-pressed={isActive}
                        aria-disabled={isDisabled}
                      >
                        {config.emoji} {config.label}
                      </button>

                      {/* Arrow button - opens product filter dropdown (only when type is active) */}
                      {isActive && !isDisabled && (
                        <button
                          ref={locationTypeButtonRefs.current[type]}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenLocationTypeDropdown(isOpen ? null : type);
                          }}
                          className="text-xs pr-2 pl-0.5 py-0.5 flex items-center transition-colors hover:opacity-80"
                          title={`${config.label} product filters`}
                          aria-label={`Open ${config.label} product filters`}
                          aria-expanded={isOpen}
                          aria-haspopup="true"
                        >
                          <svg
                            className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {isActive && !isDisabled && (
                      <ProductFilterDropdown
                        category={config.label}
                        products={getProductConfig(type)}
                        locationType={type}
                        isOpen={isOpen}
                        onClose={() => setOpenLocationTypeDropdown(null)}
                        buttonRef={locationTypeButtonRefs.current[type]}
                      />
                    )}
                  </div>
                );
              })}
              </div>
            </div>

            {/* Search, Radius, and Filters - Hidden on desktop (lg+), shown on mobile/tablet */}
            <div className="lg:hidden flex flex-col sm:flex-row items-center gap-x-3 gap-y-2">
            <label htmlFor="headerSearchAutocompleteClassic" className="sr-only">Search for local farms and cheese shops by location</label>
            <input
              ref={autocompleteInputRef}
              id="headerSearchAutocompleteClassic"
              type="text"
              placeholder="Enter a zip, city, or address"
              className="flex-grow sm:flex-grow-0 sm:w-56 md:w-64 p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              aria-label="Search for local farms and cheese shops by zip code, city, or address"
              aria-describedby="search-hint"
            />
            <span id="search-hint" className="sr-only">Start typing to search for local farms and cheese shops near you</span>
            <div className="flex items-center gap-1">
              <label htmlFor="radiusSliderHeader" className="text-xs sm:text-sm font-medium whitespace-nowrap text-white">Radius:</label>
              <input
                type="range"
                id="radiusSliderHeader"
                name="radius"
                min={RADIUS_SLIDER_MIN_MILES}
                max={RADIUS_SLIDER_MAX_MILES}
                value={localRadius}
                step={RADIUS_SLIDER_STEP_MILES}
                onChange={(e) => setLocalRadius(Number(e.target.value))}
                className="w-20 sm:w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                aria-label="Search radius"
                aria-valuemin={RADIUS_SLIDER_MIN_MILES}
                aria-valuemax={RADIUS_SLIDER_MAX_MILES}
                aria-valuenow={localRadius}
                aria-valuetext={`${localRadius} miles`}
              />
              <span id="radiusValueHeader" className="text-xs sm:text-sm font-semibold w-10 text-right text-white" aria-live="polite">
                {localRadius} mi
              </span>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MOBILE DRAWER ========== */}
      {shouldRenderDrawer && (
        <>
          {/* Backdrop - only covers below the header, not the map */}
          <div
            className={`
              md:hidden fixed left-0 right-0 bottom-0 bg-black pointer-events-auto
              transition-opacity duration-[350ms] ease-out
              ${isDrawerAnimatedOpen ? 'opacity-70' : 'opacity-0'}
            `}
            onClick={closeDrawer}
            aria-hidden="true"
            style={{ top: '3.5rem', zIndex: 9998, touchAction: 'none' }}
          />

          {/* Drawer Content */}
          <div
            className={`
              md:hidden fixed left-0 right-0
              bg-white dark:bg-gray-800
              shadow-lg rounded-b-2xl
              transition-transform duration-[350ms] ease-out
              overflow-y-auto overscroll-contain
              ${isDrawerAnimatedOpen ? 'translate-y-0' : '-translate-y-full'}
            `}
            style={{
              top: '3.5rem',
              height: 'calc(100vh - 3.5rem - 2rem)',
              zIndex: 9999,
              WebkitOverflowScrolling: 'touch',
            }}
            role="dialog"
            aria-label="Filter menu"
          >
            <div className="p-3 min-h-full">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                FILTER BY TYPE
              </h3>

              {/* Location Type Accordions - Full Width */}
              <div className="space-y-1">
                {(Object.entries(LOCATION_TYPE_CONFIG) as [LocationType, typeof LOCATION_TYPE_CONFIG[LocationType]][])
                .filter(([type]) => ENABLED_LOCATION_TYPES.includes(type))
                .map(([type, config]) => {
                  const isActive = activeLocationTypes.has(type);
                  const isDisabled = config.disabled === true;
                  const isExpanded = openDrawerAccordions.has(type);
                  const products = getProductConfig(type);

                  const bgColorClasses = {
                    green: isActive ? 'bg-green-100' : 'bg-gray-100 dark:bg-gray-700',
                    yellow: isActive ? 'bg-yellow-100' : 'bg-gray-100 dark:bg-gray-700',
                    blue: isActive ? 'bg-blue-100' : 'bg-gray-100 dark:bg-gray-700',
                    red: isActive ? 'bg-red-100' : 'bg-gray-100 dark:bg-gray-700',
                    purple: isActive ? 'bg-purple-100' : 'bg-gray-100 dark:bg-gray-700',
                    amber: isActive ? 'bg-amber-100' : 'bg-gray-100 dark:bg-gray-700',
                    rose: isActive ? 'bg-rose-100' : 'bg-gray-100 dark:bg-gray-700',
                    orange: isActive ? 'bg-orange-100' : 'bg-gray-100 dark:bg-gray-700',
                    teal: isActive ? 'bg-teal-100' : 'bg-gray-100 dark:bg-gray-700',
                    gray: isActive ? 'bg-gray-100' : 'bg-gray-100 dark:bg-gray-700',
                  };

                  const textColorClasses = isActive
                    ? {
                        green: 'text-green-700',
                        yellow: 'text-yellow-700',
                        blue: 'text-blue-700',
                        red: 'text-red-700',
                        purple: 'text-purple-700',
                        amber: 'text-amber-700',
                        rose: 'text-rose-700',
                        orange: 'text-orange-700',
                        teal: 'text-teal-700',
                        gray: 'text-gray-700',
                      }[config.color]
                    : 'text-gray-400 dark:text-gray-400';

                  return (
                    <div key={type} className="w-full">
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => !isDisabled && toggleLocationType(type)}
                        disabled={isDisabled}
                        className={`
                          w-full flex items-center justify-between
                          px-4 py-3 rounded-lg
                          transition-all duration-200
                          ${bgColorClasses[config.color]} ${textColorClasses}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-[0.98]'}
                        `}
                        aria-pressed={isActive}
                      >
                        <span className="font-medium text-sm flex items-center gap-2">
                          <span className="text-lg">{config.emoji}</span>
                          {config.label}
                        </span>

                        {/* Expand Arrow (only when active) */}
                        {isActive && !isDisabled && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDrawerAccordion(type);
                            }}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} ${config.label} products`}
                            aria-expanded={isExpanded}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </button>

                      {/* Accordion Content - Product Filters */}
                      {isActive && !isDisabled && isExpanded && Object.keys(products).length > 0 && (
                        <div
                          className="mt-1 bg-white dark:bg-gray-700 rounded-lg p-3 animate-slideDown"
                          role="region"
                          aria-labelledby={`${type}-accordion`}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            {Object.values(products).map((product: any) => {
                              const isProductActive = activeProductFilters[product.csvHeader] === true;
                              return (
                                <button
                                  key={product.csvHeader}
                                  type="button"
                                  onClick={() => toggleFilter(product.csvHeader)}
                                  className={`
                                    px-3 py-2 rounded-md text-xs font-medium
                                    transition-all duration-200
                                    ${isProductActive
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'}
                                  `}
                                  aria-pressed={isProductActive}
                                >
                                  {product.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;