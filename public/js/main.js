'use strict';

document.addEventListener("DOMContentLoaded", () => {
    if (!window.AppState) {
        console.error("CRITICAL: AppState not found on window. Aborting main.js initialization.");
        return;
    }
    const dom = AppState.dom;

    // Populate AppState.dom (ensure all IDs match your HTML)
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

    console.log("main.js: AppState.dom populated.");

    // --- Retrieve from localStorage ---
    // Constants LAST_SEARCHED_LOCATION_KEY, LAST_SELECTED_RADIUS_KEY, DEFAULT_MAP_CENTER are from config.js
    let initialSearchTerm = "Biddeford, Maine"; // Default
    let retrievedRadius = null;
    try {
        const savedLocationDataString = localStorage.getItem(LAST_SEARCHED_LOCATION_KEY);
        if (savedLocationDataString) {
            const savedLocationData = JSON.parse(savedLocationDataString);
            if (savedLocationData && savedLocationData.term) initialSearchTerm = savedLocationData.term;
        }
        const savedRadius = localStorage.getItem(LAST_SELECTED_RADIUS_KEY);
        if (savedRadius) retrievedRadius = parseInt(savedRadius, 10);
    } catch (e) { console.warn("main.js: Error retrieving from localStorage", e); }

    if (dom.searchInput) dom.searchInput.value = initialSearchTerm;

    if (dom.radiusSliderElement && retrievedRadius !== null && !isNaN(retrievedRadius)) {
        dom.radiusSliderElement.value = retrievedRadius;
        if (dom.radiusValueElement) dom.radiusValueElement.textContent = `${retrievedRadius} mi`;
    } else if (dom.radiusSliderElement && dom.radiusValueElement) {
        dom.radiusValueElement.textContent = `${dom.radiusSliderElement.value} mi`;
    }

    // --- Initial Search Modal Logic ---
    const initialSearchModal = document.getElementById('initialSearchModal');
    const modalSearchInput = document.getElementById('modalSearchInput');
    const modalSearchButton = document.getElementById('modalSearchButton');
    const modalSkipButton = document.getElementById('modalSkipButton');

    function openInitialSearchModal() {
        if (!initialSearchModal) return;
        document.body.classList.add('modal-active');
        initialSearchModal.style.display = 'flex';
        requestAnimationFrame(() => initialSearchModal.classList.add('modal-open'));
    }

    function closeInitialSearchModal() {
        if (!initialSearchModal) return;
        initialSearchModal.classList.remove('modal-open');
        setTimeout(() => {
            if (!initialSearchModal.classList.contains('modal-open')) {
                initialSearchModal.style.display = 'none';
                // Only remove modal-active if no other overlays are open
                if (!AppState.dom.detailsOverlayShopElement?.classList.contains('is-open') &&
                    !AppState.dom.detailsOverlaySocialElement?.classList.contains('is-open')) {
                    document.body.classList.remove('modal-active');
                }
            }
        }, 300);
    }

    function submitModalSearch() {
        if (!modalSearchInput || !dom.searchInput) return;
        const searchTerm = modalSearchInput.value.trim();
        if (searchTerm) {
            dom.searchInput.value = searchTerm;
            AppState.lastPlaceSelectedByAutocomplete = window.modalAutocompletePlace || null;
            window.modalAutocompletePlace = null; // Clear temp global
            closeInitialSearchModal();
            handleSearch(); // This will trigger data loading and map centering
        } else {
            modalSearchInput.focus();
            modalSearchInput.classList.add('border-red-500');
            setTimeout(() => modalSearchInput.classList.remove('border-red-500'), 2000);
        }
    }

    if (initialSearchModal && modalSearchInput && modalSearchButton && modalSkipButton) {
        openInitialSearchModal();
        // MAINE_BOUNDS_LITERAL is from mapLogic.js (or config.js if moved)
        if (window.google?.maps?.places && typeof MAINE_BOUNDS_LITERAL !== 'undefined') {
            const modalAutocomplete = new google.maps.places.Autocomplete(modalSearchInput, {
                bounds: new google.maps.LatLngBounds(MAINE_BOUNDS_LITERAL.sw, MAINE_BOUNDS_LITERAL.ne),
                strictBounds: true, componentRestrictions: { country: "us" },
                fields: ["name", "formatted_address", "geometry", "address_components", "place_id", "types"],
            });
            modalAutocomplete.addListener('place_changed', () => {
                window.modalAutocompletePlace = modalAutocomplete.getPlace(); // Store for submitModalSearch
                if (window.modalAutocompletePlace?.formatted_address) {
                    modalSearchInput.value = window.modalAutocompletePlace.formatted_address.replace(/, USA$/, "").trim();
                }
            });
        }
        modalSearchButton.addEventListener('click', submitModalSearch);
        modalSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitModalSearch(); });
        modalSkipButton.addEventListener('click', () => {
            closeInitialSearchModal();
            if (dom.searchInput.value.trim() === "" && typeof DEFAULT_MAP_CENTER !== 'undefined') {
                dom.searchInput.value = "Biddeford, Maine";
                AppState.lastPlaceSelectedByAutocomplete = null;
            }
            handleSearch(); // Perform search with default or current input
        });
    }

    // Radius Slider Listener
    if (dom.radiusSliderElement) {
        dom.radiusSliderElement.addEventListener("input", () => { if (dom.radiusValueElement) dom.radiusValueElement.textContent = `${dom.radiusSliderElement.value} mi`; });
        dom.radiusSliderElement.addEventListener("change", handleSearch);
    }

    // Search Input Listeners
    if (dom.searchInput) {
        dom.searchInput.addEventListener("input", () => { if (dom.searchInput.value.trim() === "") { AppState.lastPlaceSelectedByAutocomplete = null; handleSearch(); }});
        dom.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const currentPlace = AppState.lastPlaceSelectedByAutocomplete;
                const currentInput = dom.searchInput.value;
                if (!currentPlace || (currentInput !== (currentPlace.formatted_address || currentPlace.name))) {
                    AppState.lastPlaceSelectedByAutocomplete = null; handleSearch();
                }
            }
        });
    }

    // Escape Key Listener for Overlays
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            // closeClickedShopOverlaysAndNavigateHome handles both overlays and routing
            if (typeof closeClickedShopOverlaysAndNavigateHome === 'function') { // from uiLogic.js
                closeClickedShopOverlaysAndNavigateHome();
            }
        }
    });

    console.log("main.js: DOMContentLoaded setup complete. Waiting for map init.");
    // processAndPlotShops() is called from initAppMap in mapLogic.js after map API is ready
});

// Called by initAppMap (mapLogic.js) after Google Maps API is ready
async function processAndPlotShops() {
    console.log("main.js: processAndPlotShops called.");
    const dom = AppState.dom;
    if (dom.listingsContainer) dom.listingsContainer.innerHTML = '<p class="text-center text-gray-700 p-4 col-span-full">Loading farm stands...</p>';

    try {
        AppState.allFarmStands = await fetchAndProcessFarmStands(); // from apiService.js
    } catch (error) {
        console.error("main.js: Critical error fetching farm stands in processAndPlotShops.", error);
        if (dom.noResultsDiv) {
            dom.noResultsDiv.textContent = `Failed to load farm stand data: ${error.message}. Please try refreshing.`;
            dom.noResultsDiv.classList.remove('hidden');
            if (dom.listingsContainer) dom.listingsContainer.classList.add('hidden');
        }
        AppState.allFarmStands = [];
    }

    if (AppState.allFarmStands.length === 0 && !dom.noResultsDiv?.classList.contains('hidden')) {
        // Message already shown by fetchAndProcessFarmStands or above catch
    } else if (AppState.allFarmStands.length === 0) {
        if (dom.noResultsDiv) {
             dom.noResultsDiv.textContent = "No farm stand data available at this time.";
             dom.noResultsDiv.classList.remove('hidden');
             if(dom.listingsContainer) dom.listingsContainer.classList.add('hidden');
        }
    } else {
         console.log(`main.js: ${AppState.allFarmStands.length} Farm stands received. Slugs and coords from server.`);
    }
    
    AppState.currentlyDisplayedShops = [...AppState.allFarmStands];
    await handleSearch(); // Initial search based on default/localStorage values
    handleRouteChange();  // Handle initial URL for potential deep links AFTER data is loaded
}

async function handleSearch() {
    console.log("--- handleSearch triggered ---");
    const dom = AppState.dom;

    // Log current filter states
    console.log("Initial AppState.allFarmStands (sample):", JSON.parse(JSON.stringify(AppState.allFarmStands.slice(0, 1)))); // Log first shop
    console.log("Current activeProductFilters:", JSON.parse(JSON.stringify(AppState.activeProductFilters || {})));
    const radiusMilesFromDOM = dom.radiusSliderElement ? parseInt(dom.radiusSliderElement.value) : 30;
    console.log("Current radius (miles):", radiusMilesFromDOM);

    let searchCenterLatLng = null;
    let searchedTermForStorage = dom.searchInput ? dom.searchInput.value : "";

    // Determine searchCenterLatLng (from autocomplete or geocoding input)
    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) {
        searchCenterLatLng = AppState.lastPlaceSelectedByAutocomplete.geometry.location; // This is a Google LatLng object
        const viewport = AppState.lastPlaceSelectedByAutocomplete.geometry.viewport;
        if (map && viewport) map.fitBounds(getAdjustedBounds(viewport)); // getAdjustedBounds from mapLogic.js
        else if (map) map.setCenter(getAdjustedMapCenter(searchCenterLatLng)); // getAdjustedMapCenter from mapLogic.js
    } else if (dom.searchInput?.value.trim()) {
        const searchTerm = dom.searchInput.value.trim();
        const geocodedData = await geocodeAddressClient(searchTerm); // from apiService.js
        if (geocodedData?.lat && geocodedData?.lng) {
            searchCenterLatLng = new google.maps.LatLng(geocodedData.lat, geocodedData.lng);
            if (geocodedData.viewport && map) {
                const bounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(geocodedData.viewport.southwest.lat, geocodedData.viewport.southwest.lng),
                    new google.maps.LatLng(geocodedData.viewport.northeast.lat, geocodedData.viewport.northeast.lng)
                );
                map.fitBounds(getAdjustedBounds(bounds));
            } else if (map) {
                map.setCenter(getAdjustedMapCenter(searchCenterLatLng));
                map.setZoom(DEFAULT_MAP_ZOOM); // DEFAULT_MAP_ZOOM from config.js
            }
        } else {
            console.warn("main.js: Geocoding failed for term:", searchTerm);
            if (dom.noResultsDiv) {
                dom.noResultsDiv.innerHTML = `<p>Could not find location: "${escapeHTML(searchTerm)}".</p><p class="text-xs mt-1">Displaying stands based on current filters only.</p>`;
                dom.noResultsDiv.classList.remove('hidden');
            }
        }
    }
    console.log("searchCenterLatLng for filtering:", searchCenterLatLng ? `${searchCenterLatLng.lat()},${searchCenterLatLng.lng()}` : 'None');

    // Save search to localStorage
    if (searchedTermForStorage.trim() && searchCenterLatLng) { // Only save if a valid location was found
        try {
            localStorage.setItem(LAST_SEARCHED_LOCATION_KEY, JSON.stringify({ term: searchedTermForStorage }));
            if (dom.radiusSliderElement) localStorage.setItem(LAST_SELECTED_RADIUS_KEY, dom.radiusSliderElement.value);
        } catch (e) { console.warn("main.js: Error saving to localStorage", e); }
    }

    // --- Filtering Logic ---
    let shopsToDisplay = [...AppState.allFarmStands];
    console.log(`Starting with ${shopsToDisplay.length} shops before filtering.`);

    // 1. Product Attribute Filters
    const activeFilterKeys = Object.keys(AppState.activeProductFilters || {}).filter(key => AppState.activeProductFilters[key]);
    if (activeFilterKeys.length > 0) {
        console.log("Applying product filters for keys:", activeFilterKeys);
        shopsToDisplay = shopsToDisplay.filter(shop => 
            activeFilterKeys.every(filterKey => shop[filterKey] === true) // Assumes product props are boolean
        );
        console.log(`Shops after product filters: ${shopsToDisplay.length}`);
    } else {
        console.log("No active product filters.");
    }

    // 2. Radius Filter
    const radiusMiles = dom.radiusSliderElement ? parseInt(dom.radiusSliderElement.value) : 30;
    if (searchCenterLatLng) { // Only apply if a search center exists
        const radiusMeters = radiusMiles * 1609.344;
        console.log(`Applying radius filter: ${radiusMiles} miles (${radiusMeters.toFixed(0)}m)`);
        shopsToDisplay = shopsToDisplay.filter(shop => {
            if (shop.lat == null || shop.lng == null) return false; // Cannot calculate distance
            try {
                const shopLocation = new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng));
                const distance = google.maps.geometry.spherical.computeDistanceBetween(searchCenterLatLng, shopLocation);
                return distance <= radiusMeters;
            } catch (e) { console.error("Error in distance calculation for shop:", shop.Name, e); return false; }
        });
        console.log(`Shops after radius filter: ${shopsToDisplay.length}`);
    } else {
        console.log("No search center, skipping radius filter.");
    }

    AppState.currentlyDisplayedShops = [...shopsToDisplay];
    // --- START DEBUG LOGS FOR MARKERS ---
    console.log("[main.js - handleSearch] Number of shops TO PLOT:", AppState.currentlyDisplayedShops.length);
    if (AppState.currentlyDisplayedShops.length > 0) {
        const firstShopToPlot = AppState.currentlyDisplayedShops[0];
        console.log("[main.js - handleSearch] First shop TO PLOT (Name, Lat, Lng):",
            firstShopToPlot.Name,
            firstShopToPlot.lat,
            firstShopToPlot.lng
        );
        // Log if ANY shop has lat/lng for plotting
        const hasCoords = AppState.currentlyDisplayedShops.some(s => s.lat != null && s.lng != null);
        console.log("[main.js - handleSearch] Does ANY shop have lat/lng for plotting?", hasCoords);
    }
    // --- END DEBUG LOGS FOR MARKERS ---

    const sortAndRenderCenter = searchCenterLatLng || (map ? map.getCenter() : null);
    if (typeof renderListings === 'function') renderListings(AppState.currentlyDisplayedShops, true, sortAndRenderCenter); // from uiLogic.js
    if (typeof plotMarkers === 'function') plotMarkers(AppState.currentlyDisplayedShops); // from mapLogic.js
}

// escapeHTML is now in utils.js, ensure utils.js is loaded before main.js
// function escapeHTML(str) { ... } // REMOVED from here

// --- Client-Side Router Logic ---
function handleRouteChange() {
    const path = window.location.pathname;
    console.log("Route changed to:", path);

    // Close any open overlays first, but don't navigate home yet
    if (typeof closeClickedShopOverlays === 'function') { // from uiLogic.js
        closeClickedShopOverlays(); // This version just closes UI
    }
    
    // Ensure main listings panel is visible by default unless a specific store page hides it
    if(AppState.dom.listingsPanelElement) AppState.dom.listingsPanelElement.classList.remove('hidden');
    if(AppState.dom.noResultsDiv) AppState.dom.noResultsDiv.classList.add('hidden'); // Hide "no results" initially

    if (path.startsWith('/farm/')) {
        const storeSlug = path.substring('/farm/'.length);
        if (storeSlug && storeSlug !== "/") { // Ensure slug is not empty or just "/"
            console.log("Attempting to display store with slug:", storeSlug);
            displayStorePageBySlug(storeSlug);
        } else { // Path is just /farm/ or /farm//
            console.log("Path is /farm/ with no valid slug, displaying main page content.");
            // This case should ideally redirect to '/' or show all listings
            // For now, let's ensure the main view is rendered if no specific slug
            if (typeof renderListings === 'function') renderListings(AppState.allFarmStands, true, map ? map.getCenter() : DEFAULT_MAP_CENTER);
        }
    } else if (path === '/' || path.toLowerCase() === '/index.html') {
        console.log("Displaying main listings page (root or index.html).");
        // The view should already be correct due to handleSearch or initial load.
        // If overlays were open from a direct store link, they are now closed.
        // Ensure listings are visible if they were hidden by a store page.
        if(AppState.dom.listingsContainer && AppState.currentlyDisplayedShops.length > 0) {
            AppState.dom.listingsContainer.classList.remove('hidden');
        }
    }
    // Add more specific routes here if needed, e.g. /about
}

async function displayStorePageBySlug(storeSlug) {
    // This function is called by handleRouteChange or navigateToStoreBySlug
    if (AppState.allFarmStands.length === 0) {
        console.log("displayStorePageBySlug: Farm stands not loaded. This should ideally not happen if processAndPlotShops ran.");
        // If user lands directly on a slug URL, processAndPlotShops -> handleSearch -> handleRouteChange should have populated data.
        // If still empty, show an error or loading.
        if (AppState.dom.noResultsDiv) {
            AppState.dom.noResultsDiv.textContent = "Loading farm stand data, please wait...";
            AppState.dom.noResultsDiv.classList.remove('hidden');
        }
        return;
    }

    const shop = AppState.allFarmStands.find(s => s.slug === storeSlug);

if (shop) {
        // ---- START OF KEY DEBUG AREA ----
        console.log("[main.js - displayStorePageBySlug] Found shop for store page (by slug):", shop.Name, "Shop Object:", shop); // <<< MODIFIED TO LOG FULL SHOP
        
        if (typeof openClickedShopOverlays === 'function') { // from uiLogic.js
            openClickedShopOverlays(shop); // This opens both shop and social overlays
            
            const shopLatLng = shop.lat && shop.lng ? new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng)) : null;
            
            if (shopLatLng && typeof map !== 'undefined' && map !== null) { // Check map is not null either
                console.log("[main.js - displayStorePageBySlug] Valid shopLatLng and map. Panning/Zooming. shopLatLng:", shopLatLng.toString());
                
                // Make sure getAdjustedMapCenter is available and returns a valid LatLng or {lat,lng} object
                const adjustedCenter = getAdjustedMapCenter(shopLatLng); // from mapLogic.js
                if (adjustedCenter) {
                    console.log("[main.js - displayStorePageBySlug] Adjusted center:", adjustedCenter.toString ? adjustedCenter.toString() : JSON.stringify(adjustedCenter) );
                    map.panTo(adjustedCenter);
                    map.setZoom(15); // Zoom in on the specific store
                    console.log("[main.js - displayStorePageBySlug] Pan/Zoom supposedly complete. Current map center:", map.getCenter().toString(), "Zoom:", map.getZoom());
                } else {
                    console.warn("[main.js - displayStorePageBySlug] getAdjustedMapCenter returned invalid. Original shopLatLng:", shopLatLng.toString());
                }

                // Show infowindow for this shop if its marker exists
                if (shop.marker && typeof showInfoWindowForShop === 'function') { // showInfoWindowForShop from mapLogic.js
                    console.log("[main.js - displayStorePageBySlug] Shop has a marker. Calling showInfoWindowForShop for:", shop.Name);
                    setTimeout(() => showInfoWindowForShop(shop), 200); // Delay to allow pan/zoom
                } else {
                    console.warn("[main.js - displayStorePageBySlug] Cannot show InfoWindow. Shop marker:", shop.marker, "showInfoWindowForShop defined?", typeof showInfoWindowForShop === 'function');
                }
            } else {
                console.warn("[main.js - displayStorePageBySlug] Cannot pan/zoom. shopLatLng invalid OR map not defined. shopLatLng:", shopLatLng, "Is map defined?", typeof map !== 'undefined' && map !== null);
            }
        }
    } else {
        console.warn("Store not found for slug:", storeSlug);
        if (AppState.dom.noResultsDiv) {
            AppState.dom.noResultsDiv.textContent = `Farm stand "${escapeHTML(storeSlug.replace(/-/g, ' '))}" not found.`; // escapeHTML from utils.js
            AppState.dom.noResultsDiv.classList.remove('hidden');
            if(AppState.dom.listingsContainer) AppState.dom.listingsContainer.classList.add('hidden');
            // Ensure listings panel is visible to show the "not found" message within its context
            if(AppState.dom.listingsPanelElement) AppState.dom.listingsPanelElement.classList.remove('hidden');
        }
    }
}

function navigateToStoreBySlug(shop) { // Called when a shop card is clicked
    if (!shop || !shop.slug) {
        console.error("navigateToStoreBySlug: Shop or shop.slug is missing.", shop);
        // Fallback: just open overlays without changing URL if slug is missing
        if (typeof openClickedShopOverlays === 'function') openClickedShopOverlays(shop);
        return;
    }
    const newPath = `/farm/${shop.slug}`;
    if (window.location.pathname !== newPath) {
        window.history.pushState({ storeSlug: shop.slug }, `Farm Stand: ${shop.Name}`, newPath);
        handleRouteChange(); // This will call displayStorePageBySlug
    } else {
        // Already on the correct path, ensure overlays are open (displayStorePageBySlug handles this)
        displayStorePageBySlug(shop.slug);
    }
}

// Listen for browser back/forward navigation
window.addEventListener('popstate', handleRouteChange);