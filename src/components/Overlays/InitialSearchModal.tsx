// src/components/Overlays/InitialSearchModal.tsx
import React, { useContext, useRef, useEffect, useState } from 'react';
import { AppContext, AutocompletePlace } from '../../contexts/AppContext'; // Adjust path
import { DEFAULT_PORTLAND_CENTER, MAINE_BOUNDS_LITERAL } from '../../config/appConfig.ts'; // Adjust path

const InitialSearchModal = () => {
  const appContext = useContext(AppContext);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null); // Ref for the <input> element
  const autocompleteInstanceRef = useRef<google.maps.places.Autocomplete | null>(null); // Ref for the Autocomplete instance

  // Local state to hold the place selected by *this* autocomplete instance before submitting
  const [selectedPlaceFromModal, setSelectedPlaceFromModal] = useState<AutocompletePlace | null>(null);
  // Local state for the input field's current text value
  const [inputValue, setInputValue] = useState<string>("");

  if (!appContext) {
    console.warn("InitialSearchModal: AppContext is not available.");
    return null;
  }

  const {
    setIsInitialModalOpen,
    setLastPlaceSelectedByAutocompleteAndCookie,
    setSearchTerm,
    mapsApiReady,
  } = appContext;

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (!mapsApiReady || !autocompleteInputRef.current || !window.google?.maps?.places || autocompleteInstanceRef.current) {
      // Don't initialize if API not ready, ref not set, Places library not loaded, or already initialized
      return;
    }

    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      types: ['geocode'], // Focus on regions like towns, cities, zips, addresses
      componentRestrictions: { country: 'us' },
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components', 'types'],
    };
    
    // Set bias and restriction once Maps API is ready and input element is available
    if (MAINE_BOUNDS_LITERAL) {
        const bounds = new google.maps.LatLngBounds(
            {lat: MAINE_BOUNDS_LITERAL.south, lng: MAINE_BOUNDS_LITERAL.west},
            {lat: MAINE_BOUNDS_LITERAL.north, lng: MAINE_BOUNDS_LITERAL.east}
        );
        autocompleteOptions.bounds = bounds; // Bias results towards these bounds
        autocompleteOptions.strictBounds = false; // Allow results outside bounds but prioritize within
        console.log("InitialSearchModal: Autocomplete bounds/bias set for Maine.");
    }


    const autocomplete = new window.google.maps.places.Autocomplete(
      autocompleteInputRef.current,
      autocompleteOptions
    );
    autocompleteInstanceRef.current = autocomplete; // Store the instance

    autocomplete.addListener('place_changed', () => {
      const placeResult = autocomplete.getPlace(); // google.maps.places.PlaceResult

      if (placeResult.geometry && placeResult.geometry.location) {
        console.log("InitialSearchModal: Place selected via Autocomplete:", placeResult);
        
        // Adapt PlaceResult to your AutocompletePlace type
        const adaptedPlace: AutocompletePlace = {
          name: placeResult.name,
          formatted_address: placeResult.formatted_address,
          geometry: {
            location: {
              lat: placeResult.geometry.location.lat(),
              lng: placeResult.geometry.location.lng(),
            },
            viewport: placeResult.geometry.viewport?.toJSON(),
          },
          place_id: placeResult.place_id,
          address_components: placeResult.address_components,
          types: placeResult.types,
        };
        setSelectedPlaceFromModal(adaptedPlace);
        setInputValue(placeResult.formatted_address || placeResult.name || ""); // Update input value with selection
      } else {
        console.warn("InitialSearchModal: Autocomplete selection invalid or no geometry.");
        setSelectedPlaceFromModal(null); // Clear selection if invalid
        // Input value remains what the user typed if they didn't pick from dropdown
      }
    });

    // It's good practice, though Autocomplete might clean up some listeners.
    return () => {
        if (autocompleteInstanceRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
            // Remove the PAC container if it exists - this is important for preventing duplicates on HMR
            const pacContainers = document.getElementsByClassName('pac-container');
            for (let i = 0; i < pacContainers.length; i++) {
                pacContainers[i].remove();
            }
        }
    };

  }, [mapsApiReady]); // Re-run effect if mapsApiReady changes (e.g., on first load)


  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    // If user types something new after making a selection, clear the selection state
    if (selectedPlaceFromModal && event.target.value !== (selectedPlaceFromModal.formatted_address || selectedPlaceFromModal.name)) {
      setSelectedPlaceFromModal(null);
    }
  };


  const handleModalSearch = () => {
    if (!setIsInitialModalOpen || !setLastPlaceSelectedByAutocompleteAndCookie || !setSearchTerm) {
      console.error("InitialSearchModal: Context functions missing for search.");
      return;
    }

    if (selectedPlaceFromModal && selectedPlaceFromModal.geometry) {
      const term = selectedPlaceFromModal.formatted_address || selectedPlaceFromModal.name || "Selected Location";
      setSearchTerm(term);
      setLastPlaceSelectedByAutocompleteAndCookie(selectedPlaceFromModal, term);
      console.log("InitialSearchModal: Search submitted with selected place:", selectedPlaceFromModal);
      setIsInitialModalOpen(false);
    } else if (inputValue.trim()) {
      setSearchTerm(inputValue.trim());
      setLastPlaceSelectedByAutocompleteAndCookie(null, inputValue.trim());
      console.log("InitialSearchModal: Search submitted with input text:", inputValue.trim());
      setIsInitialModalOpen(false);
    } else {
      console.warn("InitialSearchModal: Search clicked with no input or selection.");
      autocompleteInputRef.current?.focus();
      if(autocompleteInputRef.current){
        autocompleteInputRef.current.style.border = "1px solid red";
        setTimeout(() => {
            if(autocompleteInputRef.current) autocompleteInputRef.current.style.border = "";
        }, 2000);
      }
      return; 
    }
  };

  const handleSkip = () => {
    if (!setIsInitialModalOpen || !setLastPlaceSelectedByAutocompleteAndCookie || !setSearchTerm) {
      console.error("InitialSearchModal: Context functions missing for skip.");
      return;
    }
    const portlandTerm = "Portland, Maine";
    const portlandPlace: AutocompletePlace = {
      name: portlandTerm,
      formatted_address: "Portland, ME, USA",
      geometry: { location: DEFAULT_PORTLAND_CENTER }
    };
    setSearchTerm(portlandTerm);
    setLastPlaceSelectedByAutocompleteAndCookie(portlandPlace, portlandTerm);
    setIsInitialModalOpen(false);
    console.log("InitialSearchModal: Skipped, default to Portland.");
  };

  return (
    <div
      id="initialSearchModal"
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[100] transition-opacity duration-300 ease-in-out opacity-100 visible"
    >
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-11/12 max-w-md transform transition-all duration-300 ease-in-out scale-100 opacity-100">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 text-center">
          Find Farm Stands Near You
        </h2>
        {/* Regular HTML input for Google Places Autocomplete */}
        <input
          ref={autocompleteInputRef}
          id="modalSearchAutocompleteClassic" // New unique ID
          type="text"
          placeholder="Enter your town, city, or zip code"
          className="w-full p-3 border border-gray-300 rounded-md mb-4 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={inputValue}
          onChange={handleInputChange}
          // onKeyDown could be added here to handle 'Enter' submissions if needed
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