// src/components/Overlays/InitialSearchModal.tsx
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { AutocompletePlace } from '../../types';
import { useSearch } from '../../contexts/SearchContext';
import { useUI } from '../../contexts/UIContext';
import { DEFAULT_PORTLAND_CENTER, MAINE_BOUNDS_LITERAL } from '../../config/appConfig.ts';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PlaceAutocomplete, PlaceAutocompleteRef } from '../UI/PlaceAutocomplete';

const InitialSearchModal = () => {
  const { setLastPlaceSelectedByAutocompleteAndCookie, setSearchTerm, mapsApiReady } = useSearch();
  const { setIsInitialModalOpen } = useUI();
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const autocompleteRef = useRef<PlaceAutocompleteRef | null>(null);

  // Focus trap for accessibility
  useFocusTrap({
    isActive: true,
    onClose: () => setIsInitialModalOpen(false),
    containerRef: modalContainerRef,
    initialFocusRef: undefined, // Will focus the autocomplete container instead
  });

  // Local state to hold the place selected
  const [selectedPlaceFromModal, setSelectedPlaceFromModal] = useState<AutocompletePlace | null>(null);
  const [hasError, setHasError] = useState(false);

  // Memoize location bias for Maine bounds
  const locationBias = useMemo(() => {
    if (MAINE_BOUNDS_LITERAL) {
      return {
        north: MAINE_BOUNDS_LITERAL.north,
        south: MAINE_BOUNDS_LITERAL.south,
        east: MAINE_BOUNDS_LITERAL.east,
        west: MAINE_BOUNDS_LITERAL.west
      };
    }
    return undefined;
  }, []);

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback((place: AutocompletePlace, term: string) => {
    setSelectedPlaceFromModal(place);
    setHasError(false);

    // Auto-submit on place selection for better UX
    if (place.geometry) {
      setSearchTerm(term);
      setLastPlaceSelectedByAutocompleteAndCookie(place, term);
      setIsInitialModalOpen(false);
    }
  }, [setSearchTerm, setLastPlaceSelectedByAutocompleteAndCookie, setIsInitialModalOpen]);

  const handleModalSearch = useCallback(() => {
    if (selectedPlaceFromModal && selectedPlaceFromModal.geometry) {
      const term = selectedPlaceFromModal.formatted_address || selectedPlaceFromModal.name || "Selected Location";
      setSearchTerm(term);
      setLastPlaceSelectedByAutocompleteAndCookie(selectedPlaceFromModal, term);
      setIsInitialModalOpen(false);
    } else {
      // Show error state if no valid selection
      setHasError(true);
      autocompleteRef.current?.focus();
      setTimeout(() => setHasError(false), 2000);
    }
  }, [selectedPlaceFromModal, setSearchTerm, setLastPlaceSelectedByAutocompleteAndCookie, setIsInitialModalOpen]);

  const handleSkip = useCallback(() => {
    const portlandTerm = "Portland, Maine";
    const portlandPlace: AutocompletePlace = {
      name: portlandTerm,
      formatted_address: "Portland, ME, USA",
      geometry: { location: DEFAULT_PORTLAND_CENTER }
    };
    setSearchTerm(portlandTerm);
    setLastPlaceSelectedByAutocompleteAndCookie(portlandPlace, portlandTerm);
    setIsInitialModalOpen(false);
  }, [setSearchTerm, setLastPlaceSelectedByAutocompleteAndCookie, setIsInitialModalOpen]);

  return (
    <div
      id="initialSearchModal"
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[100] transition-opacity duration-300 ease-in-out opacity-100 visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="initial-search-heading"
      aria-describedby="initial-search-description"
    >
      <div
        ref={modalContainerRef}
        className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-11/12 max-w-md transform transition-all duration-300 ease-in-out scale-100 opacity-100"
      >
        <h2
          id="initial-search-heading"
          className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 text-center"
        >
          Find Local Shops Near You
        </h2>
        <p id="initial-search-description" className="sr-only">
          Enter a location to search for local shops. Select a suggestion to search or press Escape to close.
        </p>
        {/* PlaceAutocomplete Web Component for Google Places */}
        <PlaceAutocomplete
          ref={autocompleteRef}
          onPlaceSelect={handlePlaceSelect}
          placeholder="Enter your town, city, or zip code"
          className={`place-autocomplete-modal ${hasError ? 'place-autocomplete-error' : ''}`}
          id="modalSearchAutocomplete"
          ariaLabel="Search location"
          types={['geocode']}
          includedRegionCodes={['us']}
          locationBias={locationBias}
          mapsApiReady={mapsApiReady}
        />
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleSkip}
            id="modalSkipButton"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Skip & See All
          </button>
          <button
            onClick={handleModalSearch}
            id="modalSearchButton"
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialSearchModal;