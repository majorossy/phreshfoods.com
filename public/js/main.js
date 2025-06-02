// public/js/main.js
'use strict';

const DEBUG_MAIN_JS = true;

document.addEventListener("DOMContentLoaded", () => {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] DOMContentLoaded event fired.");

    if (!window.AppState) {
        console.error("CRITICAL: AppState not found on window. Aborting main.js initialization.");
        return;
    }
    const dom = AppState.dom;

    // 1. Populate AppState.dom
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Populating AppState.dom...");
    dom.mapElement = document.getElementById("map");
    dom.listingsContainer = document.getElementById("listingsContainer");
    dom.searchAutocompleteElement = document.getElementById("searchAutocompleteElement");
    dom.modalSearchAutocompleteElement = document.getElementById('modalSearchAutocompleteElement');
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
    // Add modal elements to AppState.dom
    dom.initialSearchModal = document.getElementById('initialSearchModal'); // For Escape key and direct access
    dom.modalSearchButton = document.getElementById('modalSearchButton');   // For direct access if needed elsewhere
    dom.modalSkipButton = document.getElementById('modalSkipButton');     // For direct access if needed elsewhere


    AppState.domReadyAndPopulated = true;
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] AppState.domReadyAndPopulated set to true.");

    // 2. Determine initial state based on cookie and URL
    let showInitialModal = true; 
    let initialSearchTerm = "Biddeford, Maine"; 
    let mapShouldLoadInitially = false; 

    const savedLocationFromCookie = getCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
    const path = window.location.pathname;
    const slugMatch = path.match(/^\/farm\/(.+)/);
    const farmSlugInUrl = slugMatch && slugMatch[1];

    if (savedLocationFromCookie) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Location cookie found.");
        try {
            const locationData = JSON.parse(savedLocationFromCookie);
            if (locationData && locationData.term && locationData.place && locationData.place.geometry) {
                initialSearchTerm = locationData.term;
                AppState.lastPlaceSelectedByAutocomplete = locationData.place;
                showInitialModal = false;
                mapShouldLoadInitially = true; 
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Valid cookie. initialSearchTerm:", initialSearchTerm, "mapShouldLoadInitially: true");
            } else {
                if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Invalid cookie data. Erasing cookie.");
                eraseCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
            }
        } catch (e) {
            if (DEBUG_MAIN_JS) console.error("[main.js_DEBUG] Error parsing cookie. Erasing cookie.", e);
            eraseCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
        }
    } else if (farmSlugInUrl) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] No cookie, but farm slug in URL:", farmSlugInUrl);
        showInitialModal = false; 
        // mapShouldLoadInitially will be true after farm data is processed by handleRouteChange
    } else {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] No cookie and no farm slug in URL. Modal will be shown. Map load deferred.");
    }

    if (dom.searchAutocompleteElement) {
        dom.searchAutocompleteElement.value = initialSearchTerm;
    }
    if (dom.radiusSliderElement && dom.radiusValueElement) {
        const savedRadius = localStorage.getItem(LAST_SELECTED_RADIUS_KEY);
        if (savedRadius) dom.radiusSliderElement.value = parseInt(savedRadius, 10);
        dom.radiusValueElement.textContent = `${dom.radiusSliderElement.value} mi`;
    }

    // 3. Initialize Modal Logic (from modalLogic.js)
    if (typeof initializeModalLogic === "function") {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Calling initializeModalLogic(). showInitialModal flag:", showInitialModal);
        initializeModalLogic(showInitialModal);
    } else {
        if (DEBUG_MAIN_JS) console.error("[main.js_DEBUG] initializeModalLogic function (from modalLogic.js) not found!");
    }
    
    // 4. Attempt map initialization IF conditions were met for it (e.g. cookie exists)
    // If farmSlugInUrl, map load is triggered by handleRouteChange after farm is found.
    // If modal path, map load is triggered by modal submission.
    if (mapShouldLoadInitially) {
        if (typeof attemptMapInitialization === "function") {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Conditions met for initial map load (cookie existed). Calling attemptMapInitialization().");
            attemptMapInitialization(); 
        } else {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] attemptMapInitialization function not found.");
        }
    } else {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Initial map load deferred (no cookie, or will be handled by slug/modal).");
    }

    // 5. Setup other UI listeners
    if (dom.radiusSliderElement && dom.radiusValueElement) {
        dom.radiusSliderElement.addEventListener("input", (event) => {
            dom.radiusValueElement.textContent = `${event.target.value} mi`;
        });
        dom.radiusSliderElement.addEventListener("change", () => { 
            if (typeof handleSearch === "function") handleSearch();
        });
    }
    if (dom.searchAutocompleteElement) {
        dom.searchAutocompleteElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                AppState.lastPlaceSelectedByAutocomplete = null; 
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Enter pressed on main search. Clearing Autocomplete selection.");
                if (typeof handleSearch === "function") handleSearch();
            }
        });
    }
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (AppState.dom.initialSearchModal && AppState.dom.initialSearchModal.classList.contains('modal-open')) { // Use AppState.dom
                if (typeof closeInitialSearchModal === "function") closeInitialSearchModal(); // From modalLogic.js
            } else if (typeof closeClickedShopOverlaysAndNavigateHome === "function") { // from overlayManager.js
                closeClickedShopOverlaysAndNavigateHome();
            }
        }
    });

    // 6. Handle initial route (this will also handle farm slug in URL and potentially trigger map load)
    // Needs to run after other initializations like modal check.
    if (typeof handleRouteChange === "function") {
         if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Calling handleRouteChange() at end of primary DOMContentLoaded.");
        handleRouteChange();
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] handleRouteChange (expected from router.js) not found.");
    }

    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] DOMContentLoaded setup complete.");
});

// == Functions to be moved to searchController.js ==
async function processAndPlotShops() {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] processAndPlotShops called.");

    const path = window.location.pathname;
    const slugMatch = path.match(/^\/farm\/(.+)/);
    const farmSlugInUrl = slugMatch && slugMatch[1];
    const cookieExists = !!getCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);

    // If map is not supposed to load yet (no cookie, no slug, and modal might be next),
    // just fetch data and populate filters, but don't call handleSearch.
    if (!window.map && !cookieExists && !farmSlugInUrl && !AppState.lastPlaceSelectedByAutocomplete) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] processAndPlotShops: Map not ready and no location context. Fetching data, populating filters, deferring full search.");
        if (!AppState.allFarmStands || AppState.allFarmStands.length === 0) {
            AppState.allFarmStands = await fetchAndProcessFarmStands();
            if (typeof populateProductFilterDropdown === 'function') populateProductFilterDropdown();
        }
        return; 
    }

    // Proceed with full data processing and search if there's a reason to load/use the map
    if (!AppState.allFarmStands || AppState.allFarmStands.length === 0) {
        try {
            AppState.allFarmStands = await fetchAndProcessFarmStands();
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Farm stands fetched:", AppState.allFarmStands.length);
        } catch (error) {
            console.error("Error in processAndPlotShops fetching data:", error);
            AppState.allFarmStands = []; 
        }
    }
    if (typeof populateProductFilterDropdown === 'function') populateProductFilterDropdown();
    
    if (typeof handleSearch === "function") {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] processAndPlotShops: Calling handleSearch().");
        handleSearch();
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] processAndPlotShops: handleSearch function not found.");
        if (typeof plotMarkers === 'function' && window.map) plotMarkers(AppState.allFarmStands);
        if (typeof renderListings === 'function') renderListings(AppState.allFarmStands, false);
    }
}

async function handleSearch() {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] --- handleSearch triggered ---");
    
    const dom = AppState.dom;
    const currentPath = window.location.pathname;
    const isFarmPage = currentPath.startsWith('/farm/');

    // Ensure map is initialized if we have a location context (cookie, geocoded result, farm page)
    // OR if the user is interacting with filters/radius on the home page (implying map should be there).
    if (!window.map && (AppState.lastPlaceSelectedByAutocomplete || isFarmPage || (currentPath === '/' && dom.searchAutocompleteElement?.value.trim()))) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Map not ready but location context exists or search initiated. Attempting map initialization.");
        if (typeof attemptMapInitialization === "function") {
            await attemptMapInitialization(); 
            if (!window.map) {
                if (DEBUG_MAIN_JS) console.error("[main.js_DEBUG] handleSearch: Map still not initialized after attempt. Aborting search logic.");
                return;
            }
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Map initialized successfully within handleSearch.");
        } else {
            if (DEBUG_MAIN_JS) console.error("[main.js_DEBUG] handleSearch: attemptMapInitialization function not found. Cannot initialize map.");
            return;
        }
    } else if (!window.map && currentPath === '/' && !dom.searchAutocompleteElement?.value.trim() && !AppState.lastPlaceSelectedByAutocomplete) {
        // Case: on home page, no search term, no cookie/selection, map not loaded (modal was probably skipped)
        // We need a map to show "all" or default listings.
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Home page, no specific search, map not loaded. Attempting map initialization for default view.");
         if (typeof attemptMapInitialization === "function") {
            await attemptMapInitialization();
            if (!window.map) { /* ... error ... */ return; }
        } else { /* ... error ... */ return; }
    }


    let searchCenterLatLng = null;
    let searchedTermForStorage = dom.searchAutocompleteElement ? dom.searchAutocompleteElement.value : "";
    let placeForCookie = null;

    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) {
        const place = AppState.lastPlaceSelectedByAutocomplete;
        const loc = place.geometry.location;
        searchCenterLatLng = new google.maps.LatLng(loc.lat, loc.lng);
        let termFromPlace = (place.formatted_address || place.name || "").replace(/, USA$/, "").trim();
        if (termFromPlace) {
            searchedTermForStorage = termFromPlace;
            if (dom.searchAutocompleteElement && dom.searchAutocompleteElement.value !== searchedTermForStorage) {
                dom.searchAutocompleteElement.value = searchedTermForStorage;
            }
        }
        placeForCookie = place;
        if (window.map && place.geometry.viewport) {
            const vp = place.geometry.viewport;
            const bounds = new google.maps.LatLngBounds(
                { lat: vp.south, lng: vp.west }, { lat: vp.north, lng: vp.east }
            );
            if (typeof getAdjustedBounds === "function") map.fitBounds(getAdjustedBounds(bounds)); else map.fitBounds(bounds);
        } else if (window.map) { 
            if (typeof getAdjustedMapCenter === "function") map.panTo(getAdjustedMapCenter(searchCenterLatLng)); else map.panTo(searchCenterLatLng);
            if (typeof DEFAULT_MAP_ZOOM !== 'undefined') map.setZoom(DEFAULT_MAP_ZOOM);
        }
    } else if (dom.searchAutocompleteElement?.value.trim()) {
        const searchTerm = dom.searchAutocompleteElement.value.trim();
        searchedTermForStorage = searchTerm;
        const geocodedData = await geocodeAddressClient(searchTerm); 
        if (geocodedData?.lat && geocodedData?.lng) {
            searchCenterLatLng = new google.maps.LatLng(geocodedData.lat, geocodedData.lng);
            placeForCookie = {
                name: geocodedData.name || searchTerm,
                formatted_address: geocodedData.formatted_address || searchTerm,
                geometry: { location: { lat: geocodedData.lat, lng: geocodedData.lng }, viewport: geocodedData.viewport },
                place_id: geocodedData.place_id, types: geocodedData.types || []
            };
            if (geocodedData.formatted_address) {
                searchedTermForStorage = geocodedData.formatted_address.replace(/, USA$/, "").trim();
                if (dom.searchAutocompleteElement) dom.searchAutocompleteElement.value = searchedTermForStorage;
            }
            AppState.lastPlaceSelectedByAutocomplete = placeForCookie;
            if (window.map && geocodedData.viewport) {
                 const bounds = new google.maps.LatLngBounds(
                    {lat: geocodedData.viewport.southwest.lat, lng: geocodedData.viewport.southwest.lng},
                    {lat: geocodedData.viewport.northeast.lat, lng: geocodedData.viewport.northeast.lng}
                );
                if (typeof getAdjustedBounds === "function") map.fitBounds(getAdjustedBounds(bounds)); else map.fitBounds(bounds);
            } else if (window.map) { 
                if (typeof getAdjustedMapCenter === "function") map.panTo(getAdjustedMapCenter(searchCenterLatLng)); else map.panTo(searchCenterLatLng);
                if (typeof DEFAULT_MAP_ZOOM !== 'undefined') map.setZoom(DEFAULT_MAP_ZOOM);
            }
        } else {
            if (dom.noResultsDiv) {  dom.noResultsDiv.textContent = `Could not find location: "${escapeHTML(searchTerm)}"`; dom.noResultsDiv.classList.remove('hidden');}
            if (dom.listingsContainer) dom.listingsContainer.innerHTML = ''; // Clear listings
            AppState.lastPlaceSelectedByAutocomplete = null; placeForCookie = null; 
            // Don't return, allow product filters to still apply to all stands if desired
            // but searchCenterLatLng will be null, so radius filter won't apply.
            searchCenterLatLng = null; // Ensure it's null if geocoding failed
        }
    } else { // No search term typed, no autocomplete selection (e.g. modal skipped, or filter change)
        AppState.lastPlaceSelectedByAutocomplete = null; placeForCookie = null;
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: No specific search term. Using current map center or default for filtering.");
        if (window.map && map.getCenter()) {
            searchCenterLatLng = map.getCenter();
        } else if (typeof DEFAULT_MAP_CENTER !== 'undefined') { 
            searchCenterLatLng = new google.maps.LatLng(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng);
        }
        // If map is not yet initialized and we reach here (e.g. modal skip),
        // searchCenterLatLng will be based on DEFAULT_MAP_CENTER.
        // `performMapSetup` in mapLogic.js will use this default if map is created then.
    }

    if (searchedTermForStorage.trim() && searchCenterLatLng && placeForCookie?.geometry) {
        const locationDataForCookie = { term: searchedTermForStorage, place: placeForCookie };
        setCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME, JSON.stringify(locationDataForCookie), COOKIE_EXPIRY_DAYS);
        localStorage.setItem(LAST_SEARCHED_LOCATION_KEY, JSON.stringify({ term: searchedTermForStorage }));
        if (dom.radiusSliderElement) localStorage.setItem(LAST_SELECTED_RADIUS_KEY, dom.radiusSliderElement.value);
    }
    
    let shopsToDisplay = [...AppState.allFarmStands];
    const activeFilterKeys = Object.keys(AppState.activeProductFilters || {}).filter(key => AppState.activeProductFilters[key]);
    if (activeFilterKeys.length > 0) {
        shopsToDisplay = shopsToDisplay.filter(shop => activeFilterKeys.every(filterKey => shop[filterKey] === true));
    }

    if (searchCenterLatLng) {
        const radiusMiles = dom.radiusSliderElement ? parseInt(dom.radiusSliderElement.value) : 30;
        const radiusMeters = radiusMiles * 1609.344;
        shopsToDisplay = shopsToDisplay.filter(shop => {
            if (shop.lat == null || shop.lng == null) return false;
            try {
                if (!google?.maps?.geometry?.spherical) { console.warn("Spherical geometry library not loaded yet for distance calc."); return true; } // Default to include if lib not ready
                return google.maps.geometry.spherical.computeDistanceBetween(searchCenterLatLng, new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng))) <= radiusMeters;
            } catch (e) { console.error("Distance calc error:", e); return false; }
        });
    } else {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] No searchCenterLatLng, skipping radius filter.");
    }
    
    AppState.currentlyDisplayedShops = [...shopsToDisplay];
    const sortAndRenderCenter = searchCenterLatLng || (window.map ? map.getCenter() : null);
    if (typeof renderListings === 'function') renderListings(AppState.currentlyDisplayedShops, true, sortAndRenderCenter);
    if (typeof plotMarkers === 'function' && window.map) plotMarkers(AppState.currentlyDisplayedShops); // Only plot if map exists
    else if (typeof plotMarkers === 'function' && !window.map && shopsToDisplay.length > 0) {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Map not ready, cannot plot markers yet.");
    }

    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] --- handleSearch finished ---");
}

// == Functions to be moved to router.js ==