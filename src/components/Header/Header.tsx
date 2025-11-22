// src/components/Header/Header.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AutocompletePlace } from '../../types';
import {
  MAINE_BOUNDS_LITERAL,
  DEFAULT_PORTLAND_CENTER,
  DEFAULT_SEARCH_RADIUS_MILES,
  RADIUS_SLIDER_MIN_MILES,
  RADIUS_SLIDER_MAX_MILES,
  RADIUS_SLIDER_STEP_MILES,
  RADIUS_DEBOUNCE_MS,
} from '../../config/appConfig';
import { Link, useNavigate } from 'react-router-dom';
import ProductFilters from '../Filters/ProductFilters'; // Import the filters component
import { useDebounce } from '../../hooks/useDebounce';
import { useSearch } from '../../contexts/SearchContext';
import { useUI } from '../../contexts/UIContext';

const Header: React.FC = () => {
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const navigate = useNavigate(); // Used by handleTitleClick

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null); // For click outside listener

  // Local state for radius slider (for immediate UI feedback)
  const [localRadius, setLocalRadius] = useState<number>(DEFAULT_SEARCH_RADIUS_MILES);
  // Debounced radius value (delays filter computation)
  const debouncedRadius = useDebounce(localRadius, RADIUS_DEBOUNCE_MS);

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
  } = useUI();

  // Effect to initialize local radius from context
  useEffect(() => {
    setLocalRadius(currentRadius);
  }, []); // Only on mount

  // Effect to update context radius when debounced value changes
  useEffect(() => {
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

  // Click outside listener for filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        // Check if the click was on the filter button itself to prevent immediate re-close
        const filterButton = document.getElementById("filterToggleButton");
        if (filterButton && filterButton.contains(event.target as Node)) {
            return;
        }
        setShowFilterDropdown(false);
      }
    };
    if (showFilterDropdown) { // Only add listener if dropdown is open
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    /* ... your existing blur logic ... */
  }, []);

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    /* ... your existing keydown logic ... */
  }, []);

  const handleTitleClick = useCallback(() => {
    setSelectedShop(null);
    closeShopOverlays();

    // Reset to Portland default location instead of clearing search
    const portlandPlace: AutocompletePlace = {
      name: "Portland, Maine",
      formatted_address: "Portland, ME, USA",
      geometry: {
        location: DEFAULT_PORTLAND_CENTER,
        viewport: undefined
      },
      place_id: undefined,
      address_components: undefined,
      types: undefined
    };

    setSearchTerm('Portland, ME, USA');
    setLastPlaceSelectedByAutocompleteAndCookie(portlandPlace, 'Portland, ME, USA');
    setMapViewTargetLocation(portlandPlace);
  }, [setSelectedShop, closeShopOverlays, setSearchTerm, setLastPlaceSelectedByAutocompleteAndCookie, setMapViewTargetLocation]);

  return (
    <header className="bg-[#e8dcc3] shadow-md z-30 print:hidden" role="banner">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center py-2 gap-y-2 gap-x-4 w-full">
          {/* Logo and Title Section */}
          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
            <img src="/images/flag.png" alt="Maine Flag" className="h-8 sm:h-10 w-auto object-contain"/>
            <Link to="/" onClick={handleTitleClick} className="cursor-pointer" title="Go to Homepage" aria-label="Farm Stand Finder - Go to Homepage">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold whitespace-nowrap hover:text-blue-800 transition-colors" style={{ color: 'rgb(27, 74, 123)' }}>
                Farm Stand Finder
              </h1>
            </Link>
          </div>

          {/* Search, Radius, and Filters Section */}
          <div className="flex flex-col sm:flex-row items-center gap-x-3 gap-y-2 w-full sm:w-auto" role="search"> {/* Use gap-x for horizontal spacing */}
            <label htmlFor="headerSearchAutocompleteClassic" className="sr-only">Search for farm stands by location</label>
            <input
              ref={autocompleteInputRef}
              id="headerSearchAutocompleteClassic"
              type="text"
              placeholder="Enter a zip, city, or address"
              className="flex-grow sm:flex-grow-0 sm:w-80 md:w-96 p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              aria-label="Search for farm stands by zip code, city, or address"
              aria-describedby="search-hint"
            />
            <span id="search-hint" className="sr-only">Start typing to search for farm stands near you</span>
            <div className="flex items-center gap-1">
              <label htmlFor="radiusSliderHeader" className="text-xs sm:text-sm font-medium whitespace-nowrap text-gray-700">Radius:</label>
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
              <span id="radiusValueHeader" className="text-xs sm:text-sm font-semibold w-10 text-right text-red-700" aria-live="polite">
                {localRadius} mi
              </span>
            </div>

            {/* Filter Button and Dropdown */}
            <div className="relative">
              <button
                id="filterToggleButton" // Added ID for click outside logic
                onClick={() => setShowFilterDropdown(prev => !prev)}
                className="flex items-center gap-1 px-3 py-2.5 border border-gray-300 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors text-sm text-gray-700 shadow-sm"
                aria-expanded={showFilterDropdown}
                aria-controls="filter-dropdown-header"
                aria-label={`Product filters ${showFilterDropdown ? 'expanded' : 'collapsed'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
              {showFilterDropdown && (
                <div
                  id="filter-dropdown-header"
                  ref={filterDropdownRef}
                  className="absolute right-0 mt-2 w-80 bg-gray-50 border border-gray-200 rounded-md shadow-xl z-40 p-0" // p-0 as ProductFilters has its own padding
                  onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when clicking inside
                >
                  <ProductFilters />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;