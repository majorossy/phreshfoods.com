'use strict';

const DEBUG_MAIN_JS = false; // <-- !! ADDED DEBUG FLAG !!

document.addEventListener("DOMContentLoaded", () => {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] DOMContentLoaded event fired.");

    if (!window.AppState) {
        // CRITICAL: This error should always log, regardless of DEBUG_MAIN_JS
        console.error("CRITICAL: AppState not found on window. Aborting main.js initialization.");
        return;
    }
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] AppState found on window.", AppState);
    const dom = AppState.dom;

    // Populate AppState.dom (ensure all IDs match your HTML)
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Populating AppState.dom...");
    dom.mapElement = document.getElementById("map");
    dom.listingsContainer = document.getElementById("listingsContainer");
    dom.searchInput = document.getElementById("searchInput");
    dom.noResultsDiv = document.getElementById("noResults");
    dom.listingsPanelElement = document.getElementById("listingsPanel");
    dom.radiusSliderElement = document.getElementById("radiusSlider");
    dom.radiusValueElement = document.getElementById("radiusValue");
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
    dom.productFilterToggleElement = document.getElementById('productFilterToggle');
    dom.productFilterDropdownElement = document.getElementById('productFilterDropdown');
    dom.productFilterCheckboxesContainer = document.getElementById('productFilterCheckboxes');
    dom.resetProductFiltersButton = document.getElementById('resetProductFilters');
    dom.activeFilterCountElement = document.getElementById('activeFilterCount');

    if (DEBUG_MAIN_JS) {
        console.log("[main.js_DEBUG] AppState.dom populated. Verifying elements:");
        for (const key in dom) {
            if (Object.prototype.hasOwnProperty.call(dom, key)) {
                console.log(`[main.js_DEBUG] dom.${key}: ${dom[key] ? 'Found' : 'NOT FOUND'}`);
            }
        }
    }    

    // --- Retrieve from localStorage ---
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Retrieving data from localStorage...");
    let initialSearchTerm = "Biddeford, Maine"; // Default
    let retrievedRadius = null;
    try {
        const savedLocationDataString = localStorage.getItem(LAST_SEARCHED_LOCATION_KEY);
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] localStorage - savedLocationDataString:", savedLocationDataString);
        if (savedLocationDataString) {
            const savedLocationData = JSON.parse(savedLocationDataString);
            if (savedLocationData && savedLocationData.term) {
                initialSearchTerm = savedLocationData.term;
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] localStorage - initialSearchTerm set to:", initialSearchTerm);
            }
        }
        const savedRadius = localStorage.getItem(LAST_SELECTED_RADIUS_KEY);
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] localStorage - savedRadius:", savedRadius);
        if (savedRadius) {
            retrievedRadius = parseInt(savedRadius, 10);
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] localStorage - retrievedRadius (parsed):", retrievedRadius);
        }
    } catch (e) {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Error retrieving from localStorage", e);
        else console.warn("main.js: Error retrieving from localStorage", e);
    }

    if (dom.searchInput) {
        dom.searchInput.value = initialSearchTerm;
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Set dom.searchInput.value to:", initialSearchTerm);
    }


    if (dom.radiusSliderElement && retrievedRadius !== null && !isNaN(retrievedRadius)) {
        dom.radiusSliderElement.value = retrievedRadius;
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Set dom.radiusSliderElement.value from localStorage:", retrievedRadius);
        if (dom.radiusValueElement) dom.radiusValueElement.textContent = `${retrievedRadius} mi`;
    } else if (dom.radiusSliderElement && dom.radiusValueElement) {
        dom.radiusValueElement.textContent = `${dom.radiusSliderElement.value} mi`;
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Set dom.radiusValueElement text content from slider default:", dom.radiusSliderElement.value);
    }

    // --- Initial Search Modal Logic ---
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Initializing Search Modal logic...");
    const initialSearchModal = document.getElementById('initialSearchModal');
    const modalSearchInput = document.getElementById('modalSearchInput');
    const modalSearchButton = document.getElementById('modalSearchButton');
    const modalSkipButton = document.getElementById('modalSkipButton');

    function openInitialSearchModal() {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] openInitialSearchModal called.");
        if (!initialSearchModal) {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] initialSearchModal element not found in openInitialSearchModal.");
            return;
        }
        document.body.classList.add('modal-active');
        initialSearchModal.style.display = 'flex';
        requestAnimationFrame(() => {
            initialSearchModal.classList.add('modal-open');
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Initial search modal opened and class 'modal-open' added.");
        });
    }

    function closeInitialSearchModal() {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] closeInitialSearchModal called.");
        if (!initialSearchModal) {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] initialSearchModal element not found in closeInitialSearchModal.");
            return;
        }
        initialSearchModal.classList.remove('modal-open');
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Initial search modal class 'modal-open' removed.");
        setTimeout(() => {
            if (!initialSearchModal.classList.contains('modal-open')) {
                initialSearchModal.style.display = 'none';
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Initial search modal display set to 'none'.");
                // Only remove modal-active if no other overlays are open
                const shopOverlayOpen = AppState.dom.detailsOverlayShopElement?.classList.contains('is-open');
                const socialOverlayOpen = AppState.dom.detailsOverlaySocialElement?.classList.contains('is-open');
                if (DEBUG_MAIN_JS) console.log(`[main.js_DEBUG] Checking other overlays: shopOverlayOpen=${shopOverlayOpen}, socialOverlayOpen=${socialOverlayOpen}`);
                if (!shopOverlayOpen && !socialOverlayOpen) {
                    document.body.classList.remove('modal-active');
                    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Removed 'modal-active' from body.");
                }
            }
        }, 300);
    }

    function submitModalSearch() {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] submitModalSearch called.");
        if (!modalSearchInput || !dom.searchInput) {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] modalSearchInput or dom.searchInput not found in submitModalSearch.");
            return;
        }
        const searchTerm = modalSearchInput.value.trim();
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal search term:", searchTerm);
        if (searchTerm) {
            dom.searchInput.value = searchTerm;
            AppState.lastPlaceSelectedByAutocomplete = window.modalAutocompletePlace || null;
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] AppState.lastPlaceSelectedByAutocomplete set from modal:", AppState.lastPlaceSelectedByAutocomplete);
            window.modalAutocompletePlace = null; // Clear temp global
            closeInitialSearchModal();
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Calling handleSearch from submitModalSearch.");
            handleSearch(); // This will trigger data loading and map centering
        } else {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal search term is empty. Focusing input and adding error border.");
            modalSearchInput.focus();
            modalSearchInput.classList.add('border-red-500');
            setTimeout(() => modalSearchInput.classList.remove('border-red-500'), 2000);
        }
    }

    if (initialSearchModal && modalSearchInput && modalSearchButton && modalSkipButton) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] All initial search modal elements found. Opening modal and setting up Autocomplete.");
        openInitialSearchModal();
        // MAINE_BOUNDS_LITERAL is from mapLogic.js (or config.js if moved)
        if (window.google?.maps?.places && typeof MAINE_BOUNDS_LITERAL !== 'undefined') {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Setting up Google Places Autocomplete for modalSearchInput.");
            const modalAutocomplete = new google.maps.places.Autocomplete(modalSearchInput, {
                bounds: new google.maps.LatLngBounds(MAINE_BOUNDS_LITERAL.sw, MAINE_BOUNDS_LITERAL.ne),
                strictBounds: true, componentRestrictions: { country: "us" },
                fields: ["name", "formatted_address", "geometry", "address_components", "place_id", "types"],
            });
            modalAutocomplete.addListener('place_changed', () => {
                window.modalAutocompletePlace = modalAutocomplete.getPlace();
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal Autocomplete 'place_changed'. Place:", window.modalAutocompletePlace);
                if (window.modalAutocompletePlace?.formatted_address) {
                    modalSearchInput.value = window.modalAutocompletePlace.formatted_address.replace(/, USA$/, "").trim();
                    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Updated modalSearchInput value from autocomplete:", modalSearchInput.value);
                }
            });
        } else {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Google Maps API or MAINE_BOUNDS_LITERAL not available for modal Autocomplete.");
        }
        modalSearchButton.addEventListener('click', () => {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal search button clicked.");
            submitModalSearch();
        });
        modalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Enter key pressed in modal search input.");
                submitModalSearch();
            }
        });
        modalSkipButton.addEventListener('click', () => {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal skip button clicked.");
            closeInitialSearchModal();
            if (dom.searchInput.value.trim() === "" && typeof DEFAULT_MAP_CENTER !== 'undefined') {
                dom.searchInput.value = "Biddeford, Maine";
                AppState.lastPlaceSelectedByAutocomplete = null;
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Skipped modal search, search input was empty. Set to default 'Biddeford, Maine'.");
            }
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Calling handleSearch after skipping modal.");
            handleSearch(); // Perform search with default or current input
        });
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] One or more initial search modal elements not found. Modal logic skipped.");
    }

    // Radius Slider Listener
    if (dom.radiusSliderElement) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Adding 'input' and 'change' listeners to radiusSliderElement.");
        dom.radiusSliderElement.addEventListener("input", () => {
            if (dom.radiusValueElement) dom.radiusValueElement.textContent = `${dom.radiusSliderElement.value} mi`;
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Radius slider 'input' event. Value:", dom.radiusSliderElement.value);
        });
        dom.radiusSliderElement.addEventListener("change", () => {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Radius slider 'change' event. Value:", dom.radiusSliderElement.value, "Calling handleSearch.");
            handleSearch();
        });
    }

    // Search Input Listeners
    if (dom.searchInput) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Adding 'input' and 'keypress' listeners to searchInput.");
        dom.searchInput.addEventListener("input", () => {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Main searchInput 'input' event. Value:", dom.searchInput.value);
            if (dom.searchInput.value.trim() === "") {
                AppState.lastPlaceSelectedByAutocomplete = null;
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Main searchInput cleared. lastPlaceSelectedByAutocomplete nulled. Calling handleSearch.");
                handleSearch();
            }
        });
        dom.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Main searchInput 'Enter' keypress event.");
                const currentPlace = AppState.lastPlaceSelectedByAutocomplete;
                const currentInput = dom.searchInput.value;
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] currentPlace:", currentPlace, "currentInput:", currentInput);
                if (!currentPlace || (currentInput !== (currentPlace.formatted_address || currentPlace.name))) {
                    AppState.lastPlaceSelectedByAutocomplete = null;
                    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] No currentPlace or input mismatch. lastPlaceSelectedByAutocomplete nulled. Calling handleSearch.");
                    handleSearch();
                } else {
                    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Current place matches input, Enter keypress likely handled by autocomplete or already searched. No explicit handleSearch call here.");
                }
            }
        });
    }

    // Escape Key Listener for Overlays
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] 'Escape' key pressed.");
            if (typeof closeClickedShopOverlaysAndNavigateHome === 'function') { // from uiLogic.js
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Calling closeClickedShopOverlaysAndNavigateHome (from uiLogic.js).");
                closeClickedShopOverlaysAndNavigateHome();
            } else {
                if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] closeClickedShopOverlaysAndNavigateHome function not found.");
            }
        }
    });

    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] DOMContentLoaded setup complete. Waiting for map init.");    
    // processAndPlotShops() is called from initAppMap in mapLogic.js after map API is ready
});

// Called by initAppMap (mapLogic.js) after Google Maps API is ready
async function processAndPlotShops() {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] processAndPlotShops called.");
    const dom = AppState.dom;
    if (dom.listingsContainer) {
        dom.listingsContainer.innerHTML = '<p class="text-center text-gray-700 p-4 col-span-full">Loading farm stands...</p>';
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Set listingsContainer to 'Loading...'.");
    }

    try {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Calling fetchAndProcessFarmStands (from apiService.js).");
        AppState.allFarmStands = await fetchAndProcessFarmStands(); // from apiService.js
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] fetchAndProcessFarmStands completed. Number of stands fetched: " + (AppState.allFarmStands ? AppState.allFarmStands.length : 'null or undefined'));
        // Original debug log
        if (DEBUG_MAIN_JS) console.log("[PROCESS_SHOPS_DEBUG] fetchAndProcessFarmStands completed. Number of stands fetched: " + (AppState.allFarmStands ? AppState.allFarmStands.length : 'null or undefined'));
        if (AppState.allFarmStands && AppState.allFarmStands.length > 0) {
            if (DEBUG_MAIN_JS) console.log("[PROCESS_SHOPS_DEBUG] First fetched stand name: " + AppState.allFarmStands[0].Name, AppState.allFarmStands[0]);
        }
    } catch (error) {
        if (DEBUG_MAIN_JS) console.error("[main.js_DEBUG] Critical error fetching farm stands in processAndPlotShops.", error);
        else console.error("main.js: Critical error fetching farm stands in processAndPlotShops.", error);
        if (dom.noResultsDiv) {
            dom.noResultsDiv.textContent = `Failed to load farm stand data: ${error.message}. Please try refreshing.`;
            dom.noResultsDiv.classList.remove('hidden');
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Displayed fetch error in noResultsDiv.");
            if (dom.listingsContainer) dom.listingsContainer.classList.add('hidden');
        }
        AppState.allFarmStands = [];
    }

    if (AppState.allFarmStands.length === 0 && !dom.noResultsDiv?.classList.contains('hidden')) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] No farm stands loaded, and error message already shown.");
    } else if (AppState.allFarmStands.length === 0) {
        if (dom.noResultsDiv) {
             dom.noResultsDiv.textContent = "No farm stand data available at this time.";
             dom.noResultsDiv.classList.remove('hidden');
             if(dom.listingsContainer) dom.listingsContainer.classList.add('hidden');
             if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] No farm stands loaded, displayed 'No farm stand data available' message.");
        }
    } else {
         if (DEBUG_MAIN_JS) console.log(`[main.js_DEBUG] ${AppState.allFarmStands.length} Farm stands received. Slugs and coords from server.`);        
    }
    
    AppState.currentlyDisplayedShops = [...AppState.allFarmStands];
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] AppState.currentlyDisplayedShops initialized with allFarmStands. Count:", AppState.currentlyDisplayedShops.length);
    // Original debug log
    if (DEBUG_MAIN_JS) console.log("[PROCESS_SHOPS_DEBUG] About to call handleSearch(). AppState.currentlyDisplayedShops count: " + (AppState.currentlyDisplayedShops ? AppState.currentlyDisplayedShops.length : 'null or undefined'));

    await handleSearch(); // Initial search based on default/localStorage values
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Initial handleSearch() call completed from processAndPlotShops.");
    // Original debug log
    if (DEBUG_MAIN_JS) console.log("[PROCESS_SHOPS_DEBUG] handleSearch() call completed.");

    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Calling handleRouteChange from processAndPlotShops for initial URL processing.");
    handleRouteChange();  // Handle initial URL for potential deep links AFTER data is loaded
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] processAndPlotShops finished.");
}

async function handleSearch() {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] --- handleSearch triggered ---");
    const dom = AppState.dom;

    if (DEBUG_MAIN_JS) {
        console.log("[main.js_DEBUG] handleSearch: Initial AppState.allFarmStands (sample of 1):", AppState.allFarmStands.length > 0 ? JSON.parse(JSON.stringify(AppState.allFarmStands.slice(0, 1))) : "Empty");
        console.log("[main.js_DEBUG] handleSearch: Current activeProductFilters:", JSON.parse(JSON.stringify(AppState.activeProductFilters || {})));
        const radiusMilesFromDOM = dom.radiusSliderElement ? parseInt(dom.radiusSliderElement.value) : 30;
        console.log("[main.js_DEBUG] handleSearch: Current radius (miles from DOM):", radiusMilesFromDOM);
    }

    let searchCenterLatLng = null;
    let searchedTermForStorage = dom.searchInput ? dom.searchInput.value : "";
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: searchedTermForStorage (from input):", searchedTermForStorage);

    // Determine searchCenterLatLng (from autocomplete or geocoding input)
    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) {
        searchCenterLatLng = AppState.lastPlaceSelectedByAutocomplete.geometry.location; // This is a Google LatLng object
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Using lastPlaceSelectedByAutocomplete. LatLng:", searchCenterLatLng.toString());
        const viewport = AppState.lastPlaceSelectedByAutocomplete.geometry.viewport;
        if (typeof map !== 'undefined' && map && viewport && typeof getAdjustedBounds === 'function') {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Fitting map to autocomplete viewport.");
            map.fitBounds(getAdjustedBounds(viewport));
        } else if (typeof map !== 'undefined' && map && typeof getAdjustedMapCenter === 'function') {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Setting map center from autocomplete location.");
            map.setCenter(getAdjustedMapCenter(searchCenterLatLng));
        }
    } else if (dom.searchInput?.value.trim()) {
        const searchTerm = dom.searchInput.value.trim();
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: No autocomplete place. Attempting geocode for term:", searchTerm);
        const geocodedData = await geocodeAddressClient(searchTerm); // from apiService.js
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: geocodeAddressClient result:", geocodedData);
        if (geocodedData?.lat && geocodedData?.lng) {
            searchCenterLatLng = new google.maps.LatLng(geocodedData.lat, geocodedData.lng);
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Geocoded successfully. LatLng:", searchCenterLatLng.toString());
            if (geocodedData.viewport && typeof map !== 'undefined' && map && typeof getAdjustedBounds === 'function') {
                const bounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(geocodedData.viewport.southwest.lat, geocodedData.viewport.southwest.lng),
                    new google.maps.LatLng(geocodedData.viewport.northeast.lat, geocodedData.viewport.northeast.lng)
                );
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Fitting map to geocoded viewport.");
                map.fitBounds(getAdjustedBounds(bounds));
            } else if (typeof map !== 'undefined' && map && typeof getAdjustedMapCenter === 'function') {
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Setting map center from geocoded location and default zoom.");
                map.setCenter(getAdjustedMapCenter(searchCenterLatLng));
                if (typeof DEFAULT_MAP_ZOOM !== 'undefined') map.setZoom(DEFAULT_MAP_ZOOM);
            }
        } else {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] handleSearch: Geocoding failed for term:", searchTerm);
            else console.warn("main.js: Geocoding failed for term:", searchTerm);
            if (dom.noResultsDiv) {
                dom.noResultsDiv.innerHTML = `<p>Could not find location: "${typeof escapeHTML === 'function' ? escapeHTML(searchTerm) : searchTerm}".</p><p class="text-xs mt-1">Displaying stands based on current filters only.</p>`;
                dom.noResultsDiv.classList.remove('hidden');
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Displayed geocoding failure in noResultsDiv.");
            }
        }
    }
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: searchCenterLatLng for filtering:", searchCenterLatLng ? `${searchCenterLatLng.lat()},${searchCenterLatLng.lng()}` : 'None');

    // Save search to localStorage
    if (searchedTermForStorage.trim() && searchCenterLatLng) { // Only save if a valid location was found
        try {
            localStorage.setItem(LAST_SEARCHED_LOCATION_KEY, JSON.stringify({ term: searchedTermForStorage }));
            if (dom.radiusSliderElement) localStorage.setItem(LAST_SELECTED_RADIUS_KEY, dom.radiusSliderElement.value);
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Saved search term and radius to localStorage. Term:", searchedTermForStorage, "Radius:", dom.radiusSliderElement ? dom.radiusSliderElement.value : "N/A");
        } catch (e) {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Error saving to localStorage in handleSearch", e);
            else console.warn("main.js: Error saving to localStorage", e);
        }
    }

    // --- Filtering Logic ---
    let shopsToDisplay = [...AppState.allFarmStands];
    if (DEBUG_MAIN_JS) console.log(`[main.js_DEBUG] handleSearch: Starting with ${shopsToDisplay.length} shops before filtering.`);

    // 1. Product Attribute Filters
    const activeFilterKeys = Object.keys(AppState.activeProductFilters || {}).filter(key => AppState.activeProductFilters[key]);
    if (activeFilterKeys.length > 0) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Applying product filters for keys:", activeFilterKeys);
        shopsToDisplay = shopsToDisplay.filter(shop =>
            activeFilterKeys.every(filterKey => shop[filterKey] === true) // Assumes product props are boolean
        );
        if (DEBUG_MAIN_JS) console.log(`[main.js_DEBUG] handleSearch: Shops after product filters: ${shopsToDisplay.length}`);
    } else {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: No active product filters.");
    }

    // 2. Radius Filter
    const radiusMiles = dom.radiusSliderElement ? parseInt(dom.radiusSliderElement.value) : 30;
    if (searchCenterLatLng) { // Only apply if a search center exists
        const radiusMeters = radiusMiles * 1609.344;
        if (DEBUG_MAIN_JS) console.log(`[main.js_DEBUG] handleSearch: Applying radius filter: ${radiusMiles} miles (${radiusMeters.toFixed(0)}m) around ${searchCenterLatLng.toString()}`);
        shopsToDisplay = shopsToDisplay.filter(shop => {
            if (shop.lat == null || shop.lng == null) {
                 if (DEBUG_MAIN_JS) console.warn(`[main.js_DEBUG] Shop '${shop.Name}' missing lat/lng, excluded from radius filter.`);
                return false;
            }
            try {
                const shopLocation = new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng));
                const distance = google.maps.geometry.spherical.computeDistanceBetween(searchCenterLatLng, shopLocation);
                return distance <= radiusMeters;
            } catch (e) {
                if (DEBUG_MAIN_JS) console.error("[main.js_DEBUG] Error in distance calculation for shop:", shop.Name, e);
                else console.error("Error in distance calculation for shop:", shop.Name, e);
                return false;
            }
        });
        if (DEBUG_MAIN_JS) console.log(`[main.js_DEBUG] handleSearch: Shops after radius filter: ${shopsToDisplay.length}`);
    } else {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: No search center, skipping radius filter.");
    }

    AppState.currentlyDisplayedShops = [...shopsToDisplay];
    if (DEBUG_MAIN_JS) {
        console.log("[main.js_DEBUG] handleSearch: AppState.currentlyDisplayedShops updated. Count:", AppState.currentlyDisplayedShops.length);
        // Original debug logs
        console.log("[main.js - handleSearch] Number of shops TO PLOT:", AppState.currentlyDisplayedShops.length);
        if (AppState.currentlyDisplayedShops.length > 0) {
            const firstShopToPlot = AppState.currentlyDisplayedShops[0];
            console.log("[main.js - handleSearch] First shop TO PLOT (Name, Lat, Lng):",
                firstShopToPlot.Name,
                firstShopToPlot.lat,
                firstShopToPlot.lng
            );
            const hasCoords = AppState.currentlyDisplayedShops.some(s => s.lat != null && s.lng != null);
            console.log("[main.js - handleSearch] Does ANY shop have lat/lng for plotting?", hasCoords);
        }
    }

    const sortAndRenderCenter = searchCenterLatLng || (typeof map !== 'undefined' && map ? map.getCenter() : null);
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: sortAndRenderCenter:", sortAndRenderCenter ? sortAndRenderCenter.toString() : 'null');

    if (typeof renderListings === 'function') {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Calling renderListings (from uiLogic.js).");
        renderListings(AppState.currentlyDisplayedShops, true, sortAndRenderCenter);
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] handleSearch: renderListings function not found.");
    }
    if (typeof plotMarkers === 'function') {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Calling plotMarkers (from mapLogic.js).");
        plotMarkers(AppState.currentlyDisplayedShops);
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] handleSearch: plotMarkers function not found.");
    }

    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] --- handleSearch finished ---");
    // Original log
    if (DEBUG_MAIN_JS) console.log("[HANDLESEARCH_CALL_CHECK] handleSearch function was entered.");
}

// escapeHTML is now in utils.js, ensure utils.js is loaded before main.js

// --- Client-Side Router Logic ---
function handleRouteChange() {
    const path = window.location.pathname;
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Route changed to:", path);

    if (typeof closeClickedShopOverlays === 'function') { // from uiLogic.js
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Calling closeClickedShopOverlays (from uiLogic.js).");
        closeClickedShopOverlays(); // This version just closes UI
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] handleRouteChange: closeClickedShopOverlays function not found.");
    }
    
    if(AppState.dom.listingsPanelElement) {
        AppState.dom.listingsPanelElement.classList.remove('hidden');
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Ensured listingsPanelElement is visible.");
    }
    if(AppState.dom.noResultsDiv) {
        AppState.dom.noResultsDiv.classList.add('hidden'); // Hide "no results" initially
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Ensured noResultsDiv is hidden.");
    }


    if (path.startsWith('/farm/')) {
        const storeSlug = path.substring('/farm/'.length);
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Path is /farm/, slug extracted:", storeSlug);
        if (storeSlug && storeSlug !== "/") { // Ensure slug is not empty or just "/"
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Attempting to display store page for slug:", storeSlug);
            displayStorePageBySlug(storeSlug);
        } else {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Path is /farm/ with no valid slug. Displaying main page content.");
            if (typeof renderListings === 'function') {
                 const center = (typeof map !== 'undefined' && map ? map.getCenter() : (typeof DEFAULT_MAP_CENTER !== 'undefined' ? DEFAULT_MAP_CENTER : null));
                 if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Calling renderListings for allFarmStands. Center:", center ? (center.toString ? center.toString() : center) : 'null');
                 renderListings(AppState.allFarmStands, true, center);
            } else {
                if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] handleRouteChange: renderListings function not found for /farm/ fallback.");
            }
        }
    } else if (path === '/' || path.toLowerCase() === '/index.html') {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Displaying main listings page (root or index.html).");
        if(AppState.dom.listingsContainer && AppState.currentlyDisplayedShops.length > 0) {
            AppState.dom.listingsContainer.classList.remove('hidden');
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Ensured listingsContainer is visible for main page.");
        } else if (DEBUG_MAIN_JS) {
            console.log("[main.js_DEBUG] handleRouteChange: listingsContainer not shown on main page - either element missing or no shops displayed. Container:", AppState.dom.listingsContainer, "Shop count:", AppState.currentlyDisplayedShops.length);
        }
    } else {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange: Path not specifically handled:", path);
    }
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange finished.");
}

async function displayStorePageBySlug(storeSlug) {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug called with slug:", storeSlug);

    if (AppState.allFarmStands.length === 0) {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] displayStorePageBySlug: Farm stands not loaded yet. This might be an issue if directly landing on a slug URL before data is ready.");
        if (AppState.dom.noResultsDiv) {
            AppState.dom.noResultsDiv.textContent = "Loading farm stand data, please wait...";
            AppState.dom.noResultsDiv.classList.remove('hidden');
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Displayed 'Loading farm stand data...' message.");
        }
        // It might be beneficial to wait for data here or trigger a load if not already in progress.
        // For now, just returning.
        return;
    }

    const shop = AppState.allFarmStands.find(s => s.slug === storeSlug);

    if (shop) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Found shop for slug:", storeSlug, "Shop Object:", JSON.parse(JSON.stringify(shop))); // Deep copy for logging
        
        if (typeof openClickedShopOverlays === 'function') { // from uiLogic.js
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Calling openClickedShopOverlays (from uiLogic.js) for shop:", shop.Name);
            openClickedShopOverlays(shop);
            
            const shopLatLng = shop.lat && shop.lng ? new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng)) : null;
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Shop LatLng for map:", shopLatLng ? shopLatLng.toString() : 'null');

            if (shopLatLng && typeof map !== 'undefined' && map !== null && typeof getAdjustedMapCenter === 'function') {
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Valid shopLatLng, map, and getAdjustedMapCenter. Panning/Zooming.");
                
                const adjustedCenter = getAdjustedMapCenter(shopLatLng); // from mapLogic.js
                if (adjustedCenter) {
                    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Adjusted center for map:", adjustedCenter.toString ? adjustedCenter.toString() : JSON.stringify(adjustedCenter));
                    map.panTo(adjustedCenter);
                    map.setZoom(15); // Zoom in on the specific store
                    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Pan/Zoom complete. Current map center:", map.getCenter().toString(), "Zoom:", map.getZoom());
                } else {
                    if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] displayStorePageBySlug: getAdjustedMapCenter returned invalid. Original shopLatLng:", shopLatLng.toString());
                }

                if (shop.marker && typeof showInfoWindowForShop === 'function') { // showInfoWindowForShop from mapLogic.js
                    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Shop has a marker. Calling showInfoWindowForShop for:", shop.Name);
                    setTimeout(() => {
                        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: (setTimeout) Calling showInfoWindowForShop for:", shop.Name);
                        showInfoWindowForShop(shop);
                    }, 200);
                } else {
                    if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] displayStorePageBySlug: Cannot show InfoWindow. Shop marker:", shop.marker, "showInfoWindowForShop defined?", typeof showInfoWindowForShop === 'function');
                }
            } else {
                if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] displayStorePageBySlug: Cannot pan/zoom. Conditions not met. shopLatLng:", shopLatLng, "Is map defined & not null?", (typeof map !== 'undefined' && map !== null), "Is getAdjustedMapCenter defined?", typeof getAdjustedMapCenter === 'function');
            }
        } else {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] displayStorePageBySlug: openClickedShopOverlays function not found.");
        }
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] displayStorePageBySlug: Store not found for slug:", storeSlug);
        if (AppState.dom.noResultsDiv) {
            AppState.dom.noResultsDiv.textContent = `Farm stand "${typeof escapeHTML === 'function' ? escapeHTML(storeSlug.replace(/-/g, ' ')) : storeSlug.replace(/-/g, ' ')}" not found.`; // escapeHTML from utils.js
            AppState.dom.noResultsDiv.classList.remove('hidden');
            if(AppState.dom.listingsContainer) AppState.dom.listingsContainer.classList.add('hidden');
            if(AppState.dom.listingsPanelElement) AppState.dom.listingsPanelElement.classList.remove('hidden');
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Displayed 'Farm stand not found' message.");
        }
    }
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug finished for slug:", storeSlug);
}

function navigateToStoreBySlug(shop) { // Called when a shop card is clicked
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] navigateToStoreBySlug called with shop:", shop ? shop.Name : "undefined/null shop");

    if (!shop || !shop.slug) {
        if (DEBUG_MAIN_JS) console.error("[main.js_DEBUG] navigateToStoreBySlug: Shop or shop.slug is missing.", shop);
        else console.error("navigateToStoreBySlug: Shop or shop.slug is missing.", shop);
        // Fallback: just open overlays without changing URL if slug is missing
        if (typeof openClickedShopOverlays === 'function') {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] navigateToStoreBySlug: Fallback - calling openClickedShopOverlays due to missing slug/shop.");
            openClickedShopOverlays(shop);
        } else {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] navigateToStoreBySlug: openClickedShopOverlays function not found for fallback.");
        }
        return;
    }
    const newPath = `/farm/${shop.slug}`;
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] navigateToStoreBySlug: New path generated:", newPath);

    if (window.location.pathname !== newPath) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] navigateToStoreBySlug: Current path differs. Pushing state and calling handleRouteChange.");
        window.history.pushState({ storeSlug: shop.slug }, `Farm Stand: ${shop.Name}`, newPath);
        handleRouteChange(); // This will call displayStorePageBySlug
    } else {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] navigateToStoreBySlug: Already on the correct path. Ensuring overlays are open by calling displayStorePageBySlug.");
        displayStorePageBySlug(shop.slug); // Ensure overlays are open if already on the page
    }
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] navigateToStoreBySlug finished for shop:", shop.Name);
}

// Listen for browser back/forward navigation
window.addEventListener('popstate', (event) => {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] 'popstate' event fired. Event state:", event.state, "Calling handleRouteChange.");
    handleRouteChange();
});
