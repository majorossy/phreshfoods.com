'use strict';

const DEBUG_MAIN_JS = true;


document.addEventListener("DOMContentLoaded", () => {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] DOMContentLoaded event fired.");

    if (!window.AppState) {
        console.error("CRITICAL: AppState not found on window. Aborting main.js initialization.");
        return;
    }
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] AppState found on window.", AppState);
    const dom = AppState.dom;

    // Populate AppState.dom
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

    

    if (DEBUG_MAIN_JS) {
        console.log("[main.js_DEBUG] AppState.dom populated. Verifying elements:");
        for (const key in dom) {
            if (Object.prototype.hasOwnProperty.call(dom, key)) {
                console.log(`[main.js_DEBUG] dom.${key}: ${dom[key] ? 'Found ('+ (dom[key].id || 'N/A') +')' : 'NOT FOUND'}`);
            }
        }
    }
    AppState.domReadyAndPopulated = true;
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] AppState.domReadyAndPopulated set to true.");


    // --- Check for Location Cookie AND Retrieve from localStorage ---
    let showInitialModal = true;
    let initialSearchTerm = "Biddeford, Maine"; // Default
    const savedLocationFromCookie = getCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);

    if (savedLocationFromCookie) {
        try {
            const locationData = JSON.parse(savedLocationFromCookie);
            // Validate cookie structure
            if (locationData && locationData.term && locationData.place && locationData.place.geometry) {
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Found valid location cookie:", locationData);
                initialSearchTerm = locationData.term;
                AppState.lastPlaceSelectedByAutocomplete = locationData.place; // Pre-populate AppState
                showInitialModal = false;
            } else {
                if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Location cookie found but data is invalid or incomplete. Erasing.", locationData);
                eraseCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
            }
        } catch (e) {
            if (DEBUG_MAIN_JS) console.error("[main.js_DEBUG] Error parsing location cookie:", e);
            eraseCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
        }
    } else {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] No location cookie found.");
        // If no cookie, check localStorage as a fallback for the term only
        try {
            const savedLocationDataString = localStorage.getItem(LAST_SEARCHED_LOCATION_KEY);
            if (savedLocationDataString) {
                const savedLocationData = JSON.parse(savedLocationDataString);
                if (savedLocationData && savedLocationData.term) {
                    initialSearchTerm = savedLocationData.term;
                    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Using localStorage for initialSearchTerm (no cookie):", initialSearchTerm);
                    // Since localStorage doesn't store the full 'place' object,
                    // AppState.lastPlaceSelectedByAutocomplete remains null for now.
                    // Modal will still be shown (showInitialModal remains true).
                }
            }
        } catch (e) {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Error retrieving from localStorage (after cookie check)", e);
        }
    }

    let retrievedRadius = null;
    try {
        const savedRadius = localStorage.getItem(LAST_SELECTED_RADIUS_KEY);
        if (savedRadius) retrievedRadius = parseInt(savedRadius, 10);
    } catch (e) {
         if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Error retrieving radius from localStorage", e);
    }
    // --- END Cookie / LocalStorage Check ---

    if (dom.searchAutocompleteElement) {
        dom.searchAutocompleteElement.value = initialSearchTerm;
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Set dom.searchAutocompleteElement.value to:", initialSearchTerm);
    }

    if (dom.radiusSliderElement && retrievedRadius !== null && !isNaN(retrievedRadius)) {
        dom.radiusSliderElement.value = retrievedRadius;
        if (dom.radiusValueElement) dom.radiusValueElement.textContent = `${retrievedRadius} mi`;
    } else if (dom.radiusSliderElement && dom.radiusValueElement) {
        if (dom.radiusValueElement) dom.radiusValueElement.textContent = `${dom.radiusSliderElement.value} mi`;
    }


    // --- Initial Search Modal Logic ---
    const initialSearchModal = document.getElementById('initialSearchModal');
    const modalSearchAutocomplete = dom.modalSearchAutocompleteElement;
    const modalSearchButton = document.getElementById('modalSearchButton');
    const modalSkipButton = document.getElementById('modalSkipButton');

    function openInitialSearchModal() { /* ... (same as your version) ... */
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] openInitialSearchModal called.");
        if (!initialSearchModal) { if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] initialSearchModal element not found."); return; }
        document.body.classList.add('modal-active');
        initialSearchModal.style.display = 'flex';
        requestAnimationFrame(() => { initialSearchModal.classList.add('modal-open'); });
    }

    function closeInitialSearchModal() { /* ... (same as your version) ... */
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] closeInitialSearchModal called.");
        if (!initialSearchModal) return;
        initialSearchModal.classList.remove('modal-open');
        setTimeout(() => {
            if (!initialSearchModal.classList.contains('modal-open')) {
                initialSearchModal.style.display = 'none';
                const shopOverlayOpen = AppState.dom.detailsOverlayShopElement?.classList.contains('is-open');
                const socialOverlayOpen = AppState.dom.detailsOverlaySocialElement?.classList.contains('is-open');
                if (!shopOverlayOpen && !socialOverlayOpen) document.body.classList.remove('modal-active');
            }
        }, 300);
    }

// In main.js

// ... (other code) ...

    function submitModalSearch() { // MODIFIED Function
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] submitModalSearch called.");
        if (!modalSearchAutocomplete || !dom.searchAutocompleteElement) {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] modalSearchAutocompleteElement or dom.searchAutocompleteElement not found in submitModalSearch. Modal element:", modalSearchAutocomplete, "Main element:", dom.searchAutocompleteElement);
            return;
        }
        
        if (DEBUG_MAIN_JS) {
            console.log("[main.js_DEBUG] In submitModalSearch, modalSearchAutocomplete is:", modalSearchAutocomplete);
            console.log("[main.js_DEBUG] Raw value of modalSearchAutocomplete.value IS:", modalSearchAutocomplete.value);
            console.log("[main.js_DEBUG] window.modalAutocompletePlace (before logic) IS:", window.modalAutocompletePlace);
        }

        let searchTerm = "";
        let placeToUseForSearch = window.modalAutocompletePlace || null; // Prioritize explicitly selected place

        if (placeToUseForSearch && placeToUseForSearch.geometry) {
            // If a place was selected from autocomplete dropdown
            searchTerm = placeToUseForSearch.formatted_address || placeToUseForSearch.name || "";
            // Clean up "USA" if present, similar to handleSearch
            searchTerm = searchTerm.replace(/, USA$/, "").trim();
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal: Using selected place. Derived searchTerm:", searchTerm, "Place:", placeToUseForSearch);
        } else {
            // If no place selected from dropdown (e.g., user just typed and hit enter), use the raw input value
            const rawValue = modalSearchAutocomplete.value;
            searchTerm = (typeof rawValue === 'string') ? rawValue.trim() : "";
            // In this case, placeToUseForSearch remains null or whatever it was (likely null if no gmp-placechange)
            // AppState.lastPlaceSelectedByAutocomplete will be set to this null value,
            // and handleSearch will perform geocoding based on the searchTerm.
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal: No specific place selected from dropdown, using input value. searchTerm:", searchTerm);
        }
        
        searchTerm = searchTerm.trim(); // Ensure it's trimmed

        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal search term (final before check): '"+ searchTerm + "'");

        if (searchTerm) {
            dom.searchAutocompleteElement.value = searchTerm;
            AppState.lastPlaceSelectedByAutocomplete = placeToUseForSearch; // This will be the rich place object if selected, or null if only text typed
            
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] AppState.lastPlaceSelectedByAutocomplete set from modal:", AppState.lastPlaceSelectedByAutocomplete);
            
            window.modalAutocompletePlace = null; // Clear for next modal use
            closeInitialSearchModal();
            handleSearch();
        } else {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal search term is effectively empty. Focusing input.");
            modalSearchAutocomplete.focus();
            // Try to style the internal input of the web component
            const internalInput = modalSearchAutocomplete.shadowRoot?.querySelector('input');
            if (internalInput) {
                internalInput.classList.add('border-red-500');
                setTimeout(() => internalInput.classList.remove('border-red-500'), 2000);
            } else {
                 // Fallback if shadowRoot or internal input isn't found/accessible
                modalSearchAutocomplete.style.border = "1px solid red"; // This might not be as visually effective
                setTimeout(() => modalSearchAutocomplete.style.border = "", 2000);
            }
        }
    }

// ... (rest of main.js) ...

    if (showInitialModal && initialSearchModal && modalSearchAutocomplete && modalSearchButton && modalSkipButton) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] `showInitialModal` is true. Initializing and opening modal.");
        openInitialSearchModal();

        if (window.google?.maps?.places) {
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Setting up PlaceAutocompleteElement for modal.");
            if (typeof MAINE_BOUNDS_LITERAL !== 'undefined') {
                const biasRect = `rectangle:${MAINE_BOUNDS_LITERAL.sw.lat},${MAINE_BOUNDS_LITERAL.sw.lng},${MAINE_BOUNDS_LITERAL.ne.lat},${MAINE_BOUNDS_LITERAL.ne.lng}`;
                if (!modalSearchAutocomplete.getAttribute('location-bias')) modalSearchAutocomplete.locationBias = biasRect;
                if (!modalSearchAutocomplete.getAttribute('location-restriction')) modalSearchAutocomplete.locationRestriction = biasRect;
            }
            if (!modalSearchAutocomplete.getAttribute('country')) modalSearchAutocomplete.country = "us";
            if (!modalSearchAutocomplete.getAttribute('place-fields')) modalSearchAutocomplete.placeFields = "name,formatted_address,geometry,address_components,place_id,types";

            modalSearchAutocomplete.addEventListener('gmp-placechange', () => {
                window.modalAutocompletePlace = modalSearchAutocomplete.place;
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Modal Autocomplete 'gmp-placechange'. Place:", window.modalAutocompletePlace);
            });
        } else { /* ... warning ... */ }
        modalSearchButton.addEventListener('click', submitModalSearch);
        modalSearchAutocomplete.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); submitModalSearch(); }});
        modalSkipButton.addEventListener('click', () => {
            closeInitialSearchModal();
            if (dom.searchAutocompleteElement.value.trim() === "" && typeof DEFAULT_MAP_CENTER !== 'undefined') {
                dom.searchAutocompleteElement.value = "Biddeford, Maine";
                AppState.lastPlaceSelectedByAutocomplete = null;
            }
            handleSearch();
        });
    } else if (!showInitialModal) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] `showInitialModal` is false (due to cookie). Modal skipped.");
        // `AppState.lastPlaceSelectedByAutocomplete` should be populated from cookie
        // `initialSearchTerm` is also set from cookie.
        // Map init and `processAndPlotShops` -> `handleSearch` will proceed using this.
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Initial search modal elements not found OR modal explicitly not shown but no cookie. Modal logic skipped.");
    }

    // --- Attempt map initialization ---
    // Called once DOMContentLoaded has set AppState.domReadyAndPopulated = true.
    // It's safe to call this even if the API callback also calls it, due to checks in attemptMapInitialization.
    if (typeof attemptMapInitialization === "function") {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Calling attemptMapInitialization() from end of DOMContentLoaded.");
        attemptMapInitialization();
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] attemptMapInitialization function not found at end of DOMContentLoaded.");
    }


    if (dom.radiusSliderElement) { /* ... (radius slider listeners - same as your version) ... */ }
    const mainSearchAutocomplete = dom.searchAutocompleteElement;
    if (mainSearchAutocomplete) { /* ... (main search autocomplete listeners - same as your version) ... */ }
    document.addEventListener("keydown", (event) => { /* ... (escape key - same as your version) ... */ });

    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] DOMContentLoaded setup complete.");
});

async function processAndPlotShops() { /* ... (same as your version, no changes needed for cookie logic here) ... */ }

async function handleSearch() {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] --- handleSearch triggered ---");
    const dom = AppState.dom;
    let searchCenterLatLng = null;
    let searchedTermForStorage = dom.searchAutocompleteElement ? dom.searchAutocompleteElement.value : "";
    let placeForCookie = null; // To store the full place object for the cookie

    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: initial AppState.lastPlaceSelectedByAutocomplete:", AppState.lastPlaceSelectedByAutocomplete);

    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) {
        const place = AppState.lastPlaceSelectedByAutocomplete; // This is the rich object
        const loc = place.geometry.location; // LatLngLiteral
        searchCenterLatLng = new google.maps.LatLng(loc.lat, loc.lng);

        // Use the most reliable term from the place object for storage and display
        let termFromPlace = place.formatted_address ? place.formatted_address.replace(/, USA$/, "").trim() : (place.name || "");
        if (termFromPlace) {
            searchedTermForStorage = termFromPlace;
            if (dom.searchAutocompleteElement && dom.searchAutocompleteElement.value !== searchedTermForStorage) {
                dom.searchAutocompleteElement.value = searchedTermForStorage;
            }
        } // else searchedTermForStorage remains the input field's value

        placeForCookie = place; // The rich place object
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Using place from AppState.lastPlaceSelectedByAutocomplete for cookie and search term.");

        const viewportData = place.geometry.viewport;
        if (viewportData && map && typeof getAdjustedBounds === 'function') {
            const viewport = new google.maps.LatLngBounds(viewportData.southwest, viewportData.northeast);
            map.fitBounds(getAdjustedBounds(viewport));
        } else if (map && typeof getAdjustedMapCenter === 'function') {
            map.panTo(getAdjustedMapCenter(searchCenterLatLng));
        }
    } else if (dom.searchAutocompleteElement?.value.trim()) {
        const searchTerm = dom.searchAutocompleteElement.value.trim();
        searchedTermForStorage = searchTerm; // Initial term
        const geocodedData = await geocodeAddressClient(searchTerm);
        if (geocodedData?.lat && geocodedData?.lng) {
            searchCenterLatLng = new google.maps.LatLng(geocodedData.lat, geocodedData.lng);
            // Create a pseudo 'place' object for the cookie and AppState
            placeForCookie = {
                name: geocodedData.name || searchTerm, // Use name from geocode if available
                formatted_address: geocodedData.formatted_address || searchTerm,
                geometry: {
                    location: { lat: geocodedData.lat, lng: geocodedData.lng },
                    viewport: geocodedData.viewport // LatLngBoundsLiteral
                },
                place_id: geocodedData.place_id, // Store if available
                types: geocodedData.types || [] // Store if available
            };
            // Update searchedTermForStorage if geocoding gave a better address
            if (geocodedData.formatted_address) {
                searchedTermForStorage = geocodedData.formatted_address.replace(/, USA$/, "").trim();
                if (dom.searchAutocompleteElement) dom.searchAutocompleteElement.value = searchedTermForStorage; // Update input
            }
            AppState.lastPlaceSelectedByAutocomplete = placeForCookie; // Update AppState
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Using geocoded data. AppState updated. Place for cookie:", placeForCookie);


            if (geocodedData.viewport && map && typeof getAdjustedBounds === 'function') {
                const bounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(geocodedData.viewport.southwest.lat, geocodedData.viewport.southwest.lng),
                    new google.maps.LatLng(geocodedData.viewport.northeast.lat, geocodedData.viewport.northeast.lng)
                );
                map.fitBounds(getAdjustedBounds(bounds));
            } else if (map && typeof getAdjustedMapCenter === 'function') {
                map.panTo(getAdjustedMapCenter(searchCenterLatLng));
                if (typeof DEFAULT_MAP_ZOOM !== 'undefined') map.setZoom(DEFAULT_MAP_ZOOM);
            }
        } else {
            if (dom.noResultsDiv) { /* ... geocoding failed UI ... */ }
            // Important: If geocoding fails, clear lastPlaceSelectedByAutocomplete and placeForCookie
            // to avoid saving an invalid/old location to the cookie.
            AppState.lastPlaceSelectedByAutocomplete = null;
            placeForCookie = null;
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: Geocoding failed, nulled out placeForCookie.");
        }
    } else {
        // No search term and no pre-selected place (e.g., initial load with empty cookie/localStorage and user skipped modal)
        AppState.lastPlaceSelectedByAutocomplete = null;
        placeForCookie = null; // Ensure no cookie is set for an empty/default search
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleSearch: No search term or pre-selected place. placeForCookie is null.");
    }


    // --- Set Cookie and localStorage ---
    if (searchedTermForStorage.trim() && searchCenterLatLng && placeForCookie && placeForCookie.geometry) {
        // Ensure placeForCookie is a valid place object with geometry before saving
        const locationDataForCookie = {
            term: searchedTermForStorage,
            place: placeForCookie // Store the Autocomplete place object or the constructed one
        };
        try {
            setCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME, JSON.stringify(locationDataForCookie), COOKIE_EXPIRY_DAYS);
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Location cookie SET with term:", searchedTermForStorage, "and place:", placeForCookie);

            // Save to localStorage (for radius, and term as fallback if cookies disabled/cleared)
            localStorage.setItem(LAST_SEARCHED_LOCATION_KEY, JSON.stringify({ term: searchedTermForStorage }));
            if (dom.radiusSliderElement) localStorage.setItem(LAST_SELECTED_RADIUS_KEY, dom.radiusSliderElement.value);

        } catch (e) {
            if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Error saving to cookie/localStorage", e);
            else console.warn("main.js: Error saving to cookie/localStorage", e);
        }
    } else {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Conditions not met for setting location cookie. Term:", searchedTermForStorage, "HasLatLng:", !!searchCenterLatLng, "HasPlaceForCookie:", !!placeForCookie?.geometry);
    }
    // --- END Set Cookie and localStorage ---

    // ... (rest of handleSearch: filtering logic, renderListings, plotMarkers - same as your version) ...
    let shopsToDisplay = [...AppState.allFarmStands];
    const activeFilterKeys = Object.keys(AppState.activeProductFilters || {}).filter(key => AppState.activeProductFilters[key]);
    if (activeFilterKeys.length > 0) {
        shopsToDisplay = shopsToDisplay.filter(shop =>
            activeFilterKeys.every(filterKey => shop[filterKey] === true)
        );
    }
    const radiusMiles = dom.radiusSliderElement ? parseInt(dom.radiusSliderElement.value) : 30;
    if (searchCenterLatLng) {
        const radiusMeters = radiusMiles * 1609.344;
        shopsToDisplay = shopsToDisplay.filter(shop => {
            if (shop.lat == null || shop.lng == null) return false;
            try {
                const shopLocation = new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng));
                return google.maps.geometry.spherical.computeDistanceBetween(searchCenterLatLng, shopLocation) <= radiusMeters;
            } catch (e) { console.error("Distance calc error:", shop.Name, e); return false; }
        });
    }
    AppState.currentlyDisplayedShops = [...shopsToDisplay];
    const sortAndRenderCenter = searchCenterLatLng || (map ? map.getCenter() : null);
    if (typeof renderListings === 'function') renderListings(AppState.currentlyDisplayedShops, true, sortAndRenderCenter);
    if (typeof plotMarkers === 'function') plotMarkers(AppState.currentlyDisplayedShops);
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] --- handleSearch finished ---");
}

// --- Client-Side Router Logic (no changes for cookie logic itself) ---
function handleRouteChange() { /* ... (same as your version) ... */ }
async function displayStorePageBySlug(storeSlug) { /* ... (same as your version) ... */ }
async function _openShopDetailsAndMapFeatures(shop) { /* ... (same as your version) ... */ }
function navigateToStoreBySlug(shop) { /* ... (same as your version) ... */ }
window.addEventListener('popstate', (event) => { /* ... (same as your version) ... */ });
window.handleInfoWindowDirectionsClickById = function(shopIdentifier) { /* ... (same as your version) ... */ };