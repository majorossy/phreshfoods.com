'use strict';

// This DOMContentLoaded is primary for setting up core AppState.dom elements
// and listeners that drive the main application logic.
document.addEventListener("DOMContentLoaded", () => {
    // Ensure AppState object exists (defined in AppState.js)
    if (!window.AppState) {
        console.error("FATAL: AppState is not defined. Ensure AppState.js is loaded before main.js.");
        document.body.innerHTML = '<p style="color:red; font-size:1.2em; padding:20px;">Application critical error: Core state missing. Please refresh.</p>';
        return;
    }
    // Initialize all DOM element references in AppState.dom
    // This makes them globally accessible in a structured way.
    const dom = AppState.dom; // Alias for convenience

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
    const dom = AppState.dom; // Alias for AppState.dom
    let searchCenterLatLng = null;
    let selectedPlaceViewport = null; // To store viewport if available

    // Determine search center and potential viewport
    if (AppState.lastPlaceSelectedByAutocomplete?.geometry) {
        searchCenterLatLng = AppState.lastPlaceSelectedByAutocomplete.geometry.location;
        selectedPlaceViewport = AppState.lastPlaceSelectedByAutocomplete.geometry.viewport;
        // Map view is handled by mapLogic's autocomplete listener.
    } else if (dom.searchInput?.value.trim()) { // Manual geocode attempt
        console.log("main.js: No autocomplete, geocoding:", dom.searchInput.value);
        try {
            const geocodeData = await new Promise((resolve, reject) => {
                if (!window.geocoder) { reject("Geocoder not ready."); return; }
                window.geocoder.geocode(
                    { address: dom.searchInput.value.trim() + ", Maine, USA" },
                    (results, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry) {
                            resolve({ location: results[0].geometry.location, viewport: results[0].geometry.viewport });
                        } else { reject(status); }
                    }
                );
            });
            searchCenterLatLng = geocodeData.location;
            selectedPlaceViewport = geocodeData.viewport; // Store viewport for manual geocode
            console.log("main.js: Geocoded manually to:", searchCenterLatLng.toString());

            if (map) { // map is global from mapLogic.js
                map.setCenter(getAdjustedMapCenter(searchCenterLatLng)); // getAdjusted... in mapLogic.js
                if (selectedPlaceViewport) { // If geocoding returned a viewport (e.g., for a city)
                    console.log("main.js: Manual geocode fitting to viewport.");
                    map.fitBounds(getAdjustedBounds(selectedPlaceViewport)); // getAdjusted... in mapLogic.js
                } else { // No viewport, likely a specific address
                    console.log("main.js: Manual geocode setting DEFAULT_MAP_ZOOM.");
                    map.setZoom(DEFAULT_MAP_ZOOM); // from config.js
                }
            }
        } catch (error) {
            console.warn(`main.js: Geocoding error for "${dom.searchInput.value.trim()}": ${error}`);
            // No searchCenterLatLng means radius filter won't apply
            // Optionally inform user: if(dom.noResultsDiv) dom.noResultsDiv.textContent = "Could not find location: " + dom.searchInput.value;
        }
    }

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