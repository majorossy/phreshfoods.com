'use strict';

document.addEventListener("DOMContentLoaded", () => {
    if (!window.AppState) { /* ... */ return; }
    const dom = AppState.dom;

    // ... (Populate ALL AppState.dom elements as before) ...
    dom.productFilterToggleElement = document.getElementById('productFilterToggle');
    // ... ALL OTHERS ...
    dom.radiusSliderElement = document.getElementById("radiusSlider");
    dom.radiusValueElement = document.getElementById("radiusValue");


    // --- Retrieve from localStorage ---
    let initialSearchTerm = "Biddeford, Maine"; // Default initial search
    let retrievedRadius = null;
    try {
        const savedLocationDataString = localStorage.getItem(LAST_SEARCHED_LOCATION_KEY);
        if (savedLocationDataString) {
            const savedLocationData = JSON.parse(savedLocationDataString);
            if (savedLocationData && savedLocationData.term) {
                initialSearchTerm = savedLocationData.term;
                console.log("main.js: Retrieved last searched location term:", initialSearchTerm);
            }
        }
        const savedRadius = localStorage.getItem(LAST_SELECTED_RADIUS_KEY);
        if (savedRadius) {
            retrievedRadius = parseInt(savedRadius, 10);
            console.log("main.js: Retrieved last selected radius:", retrievedRadius);
        }
    } catch (e) {
        console.warn("main.js: Error retrieving from localStorage", e);
    }
    // --- End Retrieve from localStorage ---


    // Apply retrieved radius to slider (if it exists)
    if (dom.radiusSliderElement && retrievedRadius !== null && !isNaN(retrievedRadius)) {
        dom.radiusSliderElement.value = retrievedRadius;
        if (dom.radiusValueElement) dom.radiusValueElement.textContent = `${retrievedRadius} mi`;
    } else if (dom.radiusSliderElement && dom.radiusValueElement) { // Set default display if nothing retrieved
        dom.radiusValueElement.textContent = `${dom.radiusSliderElement.value} mi`;
    }

        // --- START: Initial Search Modal Logic ---
    const initialSearchModal = document.getElementById('initialSearchModal');
    const modalSearchInput = document.getElementById('modalSearchInput');
    const modalSearchButton = document.getElementById('modalSearchButton');
    const modalSkipButton = document.getElementById('modalSkipButton');
    

    function openInitialSearchModal() {
        if (initialSearchModal) {
            document.body.classList.add('modal-active');
            initialSearchModal.style.display = 'flex'; // Make sure it's not display:none from Tailwind hidden
            // Force reflow for transition
            void initialSearchModal.offsetWidth;
            initialSearchModal.classList.add('modal-open');
        }
    }

    function closeInitialSearchModal() {
        if (initialSearchModal) {
            document.body.classList.remove('modal-active');
            initialSearchModal.classList.remove('modal-open');
            // Wait for transition before hiding, or hide immediately
            setTimeout(() => {
                if (!initialSearchModal.classList.contains('modal-open')) { // Check again in case re-opened quickly
                    initialSearchModal.style.display = 'none';
                }
            }, 300); // Match transition duration
        }
    }

    function submitModalSearch() {
        if (modalSearchInput && dom.searchInput) { // dom.searchInput is the main header search
            const searchTerm = modalSearchInput.value.trim();
            if (searchTerm) {
                dom.searchInput.value = searchTerm; // Transfer value to main search bar
                // If using Autocomplete on modalSearchInput, ensure its selection populates main search or AppState
                if (window.modalAutocompletePlace && window.modalAutocompletePlace.geometry) {
                    AppState.lastPlaceSelectedByAutocomplete = window.modalAutocompletePlace;
                    console.log("Using modal autocomplete place for initial search:", window.modalAutocompletePlace.name);
                } else {
                    // If no autocomplete selection from modal, clear it so main.js geocodes manually
                    AppState.lastPlaceSelectedByAutocomplete = null;
                }
                closeInitialSearchModal();
                handleSearch(); // Trigger main search logic
            } else {
                // Optional: Show error in modal if input is empty
                modalSearchInput.focus();
                modalSearchInput.classList.add('border-red-500'); // Example error indication
                setTimeout(() => modalSearchInput.classList.remove('border-red-500'), 2000);
            }
        }
    }

    if (initialSearchModal && modalSearchInput && modalSearchButton && modalSkipButton) {
        openInitialSearchModal(); // Show modal on load

        // Initialize Autocomplete for the modal input if Google Maps API is ready
        // This needs to happen after mapLogic's initAppMap or have a similar ready check.
        // For simplicity, we'll assume Google Maps API script has loaded.
        // A more robust way is to initialize this within initAppMap or after a maps ready event.
        if (window.google && window.google.maps && window.google.maps.places) {
            const modalAutocomplete = new google.maps.places.Autocomplete(modalSearchInput, {
                bounds: MAINE_BOUNDS_LITERAL, // From mapLogic.js or define in config.js and use here
                strictBounds: true,
                componentRestrictions: { country: "us" },
                fields: ["name", "formatted_address", "geometry", "address_components", "place_id", "types"],
            });
            modalAutocomplete.addListener('place_changed', () => {
                window.modalAutocompletePlace = modalAutocomplete.getPlace(); // Store it for submitModalSearch
                 // Optionally update modal input to cleaned address
                if (window.modalAutocompletePlace && window.modalAutocompletePlace.formatted_address) {
                    let displayAddress = window.modalAutocompletePlace.formatted_address;
                    const countryString = ", USA";
                    if (displayAddress.endsWith(countryString)) {
                        displayAddress = displayAddress.substring(0, displayAddress.length - countryString.length);
                    }
                    modalSearchInput.value = displayAddress.replace(/,\s*$/, "").trim();
                }
            });
        } else {
            console.warn("main.js: Google Places API not ready for modal autocomplete setup. Will fallback to text search.");
        }


        modalSearchButton.addEventListener('click', submitModalSearch);
        modalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitModalSearch();
            }
        });
        modalSkipButton.addEventListener('click', () => {
            closeInitialSearchModal();
            // Optionally set default search ("Biddeford, Maine") and run handleSearch
            // if user skips, or just let them browse without initial search results based on location
            if(dom.searchInput.value.trim() === "" && DEFAULT_MAP_CENTER){ // if main search is empty after skip
                dom.searchInput.value = "Biddeford, Maine"; // Or some other default
                 AppState.lastPlaceSelectedByAutocomplete = null; // Ensure manual geocode for this default
            }
            handleSearch(); // Or only if a default was set
        });

        // Optional: Handle "Use My Location"
        // if (modalUseMyLocationButton) {
        //     modalUseMyLocationButton.addEventListener('click', () => { /* ... geolocation logic ... */ });
        // }
    }
    // --- END: Initial Search Modal Logic ---


    dom.listingsContainer = document.getElementById("listingsContainer");
    dom.searchInput = document.getElementById("searchInput");
    dom.noResultsDiv = document.getElementById("noResults");
    dom.listingsPanelElement = document.getElementById("listingsPanel");
    dom.mapElement = document.getElementById("map"); // Crucial for mapLogic

    // Overlays and key child elements (others might be handled by uiLogic if more specific)
    dom.detailsOverlayShopElement = document.getElementById("detailsOverlayShop");
    dom.detailsOverlaySocialElement = document.getElementById("detailsOverlaySocial");
    dom.shopDetailNameElement = document.getElementById('shopDetailName');
    dom.shopImageGallery = document.getElementById('shopImageGallery');
    dom.shopProductIconsContainer = document.getElementById('shopProductIconsContainer');
    dom.shopOpeningHoursContainer = document.getElementById('shopOpeningHoursContainer');
    dom.socialLinksContainer = document.getElementById('socialLinksContainer');
    dom.twitterTimelineContainer = document.getElementById('twitterTimelineContainer');
    dom.instagramFeedContainer = document.getElementById('instagramFeedContainer');
    dom.socialOverlayReviewsContainer = document.getElementById('socialOverlayReviewsContainer');
    dom.socialOverlayGooglePhotosContainer = document.getElementById('socialOverlayGooglePhotosContainer');
    dom.socialOverlayTabs = document.getElementById('socialOverlayTabs');
    dom.getShopDirectionsButton = document.getElementById('getShopDirectionsButton');
    dom.clearShopDirectionsButton = document.getElementById('clearShopDirectionsButton');
    dom.closeDetailsOverlaySocialButton = document.getElementById('closeDetailsOverlaySocialButton');
    dom.closeDetailsOverlayShopButton = document.getElementById('closeDetailsOverlayShopButton');
    dom.directionsPanel = document.getElementById('directionsPanel');

    // Filter UI elements (uiLogic.js will attach detailed listeners to checkboxes)
    dom.productFilterToggleElement = document.getElementById('productFilterToggle');
    dom.productFilterDropdownElement = document.getElementById('productFilterDropdown');
    dom.productFilterCheckboxesContainer = document.getElementById('productFilterCheckboxes');
    dom.resetProductFiltersButton = document.getElementById('resetProductFilters');
    dom.activeFilterCountElement = document.getElementById('activeFilterCount');

        // ADD LOGS HERE TO CONFIRM ASSIGNMENT IN main.js
    console.log("main.js: dom.productFilterToggleElement is:", dom.productFilterToggleElement);
    console.log("main.js: dom.productFilterDropdownElement is:", dom.productFilterDropdownElement);

    
    // Radius Slider
    dom.radiusSliderElement = document.getElementById("radiusSlider");
    dom.radiusValueElement = document.getElementById("radiusValue");

    if (dom.radiusSliderElement && dom.radiusValueElement) {
        dom.radiusValueElement.textContent = `${dom.radiusSliderElement.value} mi`;
        dom.radiusSliderElement.addEventListener("input", () => {
            if(dom.radiusValueElement) dom.radiusValueElement.textContent = `${dom.radiusSliderElement.value} mi`;
        });
        dom.radiusSliderElement.addEventListener("change", handleSearch); // Calls the main search handler
    } else {
        console.warn("main.js: Radius slider/value element(s) not found.");
    }

    if (dom.searchInput) {
        dom.searchInput.addEventListener("input", () => {
            if (dom.searchInput.value.trim() === "") { // If search input is cleared
                AppState.lastPlaceSelectedByAutocomplete = null;
                handleSearch(); // Re-run search to reflect the cleared state
            }
        });
        dom.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                // If user hits enter, and it wasn't an autocomplete pick OR input has changed since autocomplete
                if (!AppState.lastPlaceSelectedByAutocomplete ||
                    dom.searchInput.value !== (AppState.lastPlaceSelectedByAutocomplete.formatted_address || AppState.lastPlaceSelectedByAutocomplete.name)) {
                    console.log("main.js: Enter on searchInput. Forcing manual geocode.");
                    AppState.lastPlaceSelectedByAutocomplete = null; // Treat as manual search
                    handleSearch();
                }
            }
        });
    } else {
        console.warn("main.js: Search input element not found.");
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (dom.detailsOverlayShopElement?.classList.contains('is-open') || dom.detailsOverlaySocialElement?.classList.contains('is-open')) {
                if (typeof closeClickedShopOverlays === 'function') closeClickedShopOverlays(); // Function from uiLogic.js
            }
        }
    });

    console.log("main.js: DOM Content Loaded. Core listeners attached.");
    // The call to processAndPlotShops() is now deferred to initAppMap in mapLogic.js
    // to ensure Google Maps API is ready first.
});


async function populateAllShopsWithLatLng(shopsArray) { // Expects AppState.allFarmStands to be passed
    console.log("main.js: Populating Lat/Lng for shops...");
    // These are globals initialized by mapLogic.js's initAppMap
    if (!window.placesService || !window.geocoder) {
        console.error("main.js: PlacesService or Geocoder not initialized (expected from mapLogic.js).");
        // No UI alert here, mapLogic or API service should handle fundamental load failures
        return; // Stop if map services aren't ready
    }

    const promises = shopsArray.map(shop => {
        return new Promise(resolve => {
            if (shop.lat && shop.lng) return resolve(); // Already have coordinates

            if (shop.GoogleProfileID) {
                placesService.getDetails({ placeId: shop.GoogleProfileID, fields: ["geometry"] }, (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                        shop.lat = place.geometry.location.lat();
                        shop.lng = place.geometry.location.lng();
                        resolve();
                    } else {
                        console.warn(`Places API (geometry) failed for ${shop.Name} (ID: ${shop.GoogleProfileID}): ${status}. Trying address.`);
                        if (shop.Address && shop.Address !== "N/A") {
                            geocoder.geocode({ address: shop.Address + ", Maine, USA" }, (results, geoStatus) => {
                                if (geoStatus === "OK" && results?.[0]?.geometry) {
                                    shop.lat = results[0].geometry.location.lat();
                                    shop.lng = results[0].geometry.location.lng();
                                } else { console.warn(`Geocode fallback for ${shop.Name} failed: ${geoStatus}`); }
                                resolve(); // Resolve even if fallback failed
                            });
                        } else { resolve(); } // No address for fallback
                    }
                });
            } else if (shop.Address && shop.Address !== "N/A") {
                geocoder.geocode({ address: shop.Address + ", Maine, USA" }, (results, geoStatus) => {
                    if (geoStatus === "OK" && results?.[0]?.geometry) {
                        shop.lat = results[0].geometry.location.lat();
                        shop.lng = results[0].geometry.location.lng();
                    } else { console.warn(`Geocode failed for ${shop.Name} (Address only): ${geoStatus}`); }
                    resolve();
                });
            } else {
                console.warn(`Cannot geolocate ${shop.Name}: No PlaceID or valid Address.`);
                resolve(); // Resolve so Promise.all doesn't hang
            }
        });
    });
    await Promise.all(promises);
    console.log("main.js: Finished populating Lat/Lng for all shops.");
}

// Called by initAppMap (mapLogic.js) after Google Maps API is ready
async function processAndPlotShops() {
    console.log("main.js: processAndPlotShops called.");
    const dom = AppState.dom; // Use alias for AppState.dom

    if (dom.listingsContainer) dom.listingsContainer.innerHTML = '<p class="text-center text-gray-700 p-4 col-span-full">Loading farm stands...</p>';

    AppState.allFarmStands = await fetchSheetData(); // From apiService.js

    if (AppState.allFarmStands.length === 0) {
        // Error messaging for data load failure is now primarily handled within fetchSheetData
        // This ensures that even if main.js calls this before DOM for noResultsDiv is ready, error is caught
        console.log("main.js: No farm stand data returned from fetchSheetData.");
        if (dom.noResultsDiv && dom.noResultsDiv.textContent.trim() === "") { // Check if fetchSheetData already put a message
             dom.noResultsDiv.textContent = "No farm stand data available at this time.";
             dom.noResultsDiv.classList.remove('hidden');
             if(dom.listingsContainer) dom.listingsContainer.classList.add('hidden');
        }
        AppState.currentlyDisplayedShops = []; // Ensure it's an empty array
        return; // Stop further processing if no data
    }

    await populateAllShopsWithLatLng(AppState.allFarmStands);
    AppState.currentlyDisplayedShops = [...AppState.allFarmStands]; // Initialize with all shops

    // Initial search call - relies on HTML 'value' for searchInput or an empty string
    await handleSearch();
}

async function handleSearch() {
    console.log("main.js: handleSearch triggered.");
    const dom = AppState.dom;
    let searchCenterLatLng = null;
    let searchedTermForStorage = dom.searchInput ? dom.searchInput.value : ""; // Get the term early for storage
    let selectedPlaceViewport = null;

    if (AppState.lastPlaceSelectedByAutocomplete?.geometry) {
        searchCenterLatLng = AppState.lastPlaceSelectedByAutocomplete.geometry.location;
        selectedPlaceViewport = AppState.lastPlaceSelectedByAutocomplete.geometry.viewport;
        // The search term is already in dom.searchInput from autocomplete listener
        searchedTermForStorage = dom.searchInput.value;
    } else if (dom.searchInput?.value.trim()) {
        try {
            const geocodeData = await new Promise((resolve, reject) => { /* ... geocoding logic ... */ });
            searchCenterLatLng = geocodeData.location;
            selectedPlaceViewport = geocodeData.viewport;
            // searchedTermForStorage is already set from dom.searchInput.value
            // ... (map view updates as before) ...
        } catch (error) { /* ... error handling ... */ }
    }

    // --- Save to localStorage IF a valid search was performed ---
    if (searchedTermForStorage.trim() && searchCenterLatLng) { // Only save if we actually got a location for the term
        try {
            const locationDataToStore = {
                term: searchedTermForStorage,
                // Optionally store lat/lng if you want to bypass geocoding on next load,
                // but storing the term is often enough and simpler.
                // lat: searchCenterLatLng.lat(),
                // lng: searchCenterLatLng.lng()
            };
            localStorage.setItem(LAST_SEARCHED_LOCATION_KEY, JSON.stringify(locationDataToStore));
            console.log("main.js: Saved last searched location:", locationDataToStore);

            if (dom.radiusSliderElement) {
                localStorage.setItem(LAST_SELECTED_RADIUS_KEY, dom.radiusSliderElement.value);
                console.log("main.js: Saved last selected radius:", dom.radiusSliderElement.value);
            }
        } catch (e) {
            console.warn("main.js: Error saving to localStorage", e);
        }
    }
    // --- End Save to localStorage ---


    // --- Filtering Logic ---
    let shopsToDisplay = [...AppState.allFarmStands];

    // 1. Product Attribute Filters
    const activeFilterKeys = Object.keys(AppState.activeProductFilters || {}).filter(key => AppState.activeProductFilters[key]);
    if (activeFilterKeys.length > 0) {
        shopsToDisplay = shopsToDisplay.filter(shop =>
            activeFilterKeys.every(filterKey => shop[filterKey] === true)
        );
        console.log(`main.js: ${shopsToDisplay.length} shops after product filters:`, activeFilterKeys.join(', '));
    }

    // 2. Radius Filter
    const radiusMiles = dom.radiusSliderElement ? parseInt(dom.radiusSliderElement.value) : 30;
    if (searchCenterLatLng) { // Only apply if a search center (from autocomplete or geocoding) exists
        const radiusMeters = radiusMiles * 1609.344;
        shopsToDisplay = shopsToDisplay.filter(shop => {
            if (shop.lat == null || shop.lng == null) return false;
            try {
                const shopLocation = new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng));
                return google.maps.geometry.spherical.computeDistanceBetween(searchCenterLatLng, shopLocation) <= radiusMeters;
            } catch (e) { console.error("Error in distance calculation for shop:", shop.Name, e); return false; }
        });
        console.log(`main.js: ${shopsToDisplay.length} shops after radius filter (${radiusMiles}mi).`);
    } else if (dom.searchInput?.value.trim()) {
         // If there was search text, but geocoding failed (no searchCenterLatLng)
         console.log("main.js: Search text exists but no valid location for radius filter. Showing all (product-filtered) shops.");
    }


    AppState.currentlyDisplayedShops = [...shopsToDisplay];

    // Determine center for sorting: use searchCenter if available, else current map center
    const sortAndRenderCenter = searchCenterLatLng || (map ? map.getCenter() : null);

    if(typeof renderListings === 'function') renderListings(AppState.currentlyDisplayedShops, true, sortAndRenderCenter); // In uiLogic.js
    else console.error("main.js: renderListings function (uiLogic.js) not found.");

    if(typeof plotMarkers === 'function') plotMarkers(AppState.currentlyDisplayedShops); // In mapLogic.js
    else console.error("main.js: plotMarkers function (mapLogic.js) not found.");
}