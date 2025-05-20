// js/main.js

// --- Global State Variables ---
let allFarmStands = [];
let currentlyDisplayedShops = []; // Shops currently shown in the list (can be all or filtered)
let markerClickedRecently = false; // For map click vs marker click logic
let currentShopForDirections = null;

// --- DOM Element Variables (to be initialized on DOMContentLoaded) ---
let listingsContainer, searchInput, noResultsDiv, listingsPanelElement,
    detailsOverlayShopElement, closeDetailsOverlayShopButton,
    shopDetailNameElement, shopDetailRatingStarsElement, shopDetailAddressElement,
    shopDetailDistanceElement, shopDetailPhoneElement, shopDetailWebsiteElement,
    shopDetailMapLinkContainerElement, detailsOverlaySocialElement,
    closeDetailsOverlaySocialButton, socialLinksContainerElement,
    twitterTimelineContainerElement;





async function populateAllShopsWithLatLng(shops) {
    console.log("Populating Lat/Lng for all shops...");
    if (!placesService || !window.geocoder) { // Ensure google maps objects are available
        console.error("PlacesService or Geocoder not initialized in mapLogic.js. Cannot populate Lat/Lng.");
        alert("Map services are not ready. Please refresh the page.");
        return;
    }

    const promises = shops.map(async (shop) => {
        if (shop.lat && shop.lng) return Promise.resolve(); // Already have lat/lng

        // Create a new promise for each shop's geocoding/place details lookup
        return new Promise(resolve => {
            if (shop.GoogleProfileID) {
                placesService.getDetails({ placeId: shop.GoogleProfileID, fields: ['geometry'] }, (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                        shop.lat = place.geometry.location.lat();
                        shop.lng = place.geometry.location.lng();
                        // console.log(`Populated lat/lng for ${shop.Name} via PlaceID`);
                    } else {
                        // console.warn(`Place Details failed for ${shop.Name} (ID: ${shop.GoogleProfileID}): ${status}. Trying address.`);
                        if (shop.Address && shop.Address !== 'N/A') {
                            window.geocoder.geocode({ 'address': shop.Address + ', Maine, USA' }, (results, geoStatus) => {
                                if (geoStatus === 'OK' && results[0]?.geometry) {
                                    shop.lat = results[0].geometry.location.lat();
                                    shop.lng = results[0].geometry.location.lng();
                                    // console.log(`Populated lat/lng for ${shop.Name} via Address (fallback).`);
                                } else {
                                    console.warn(`Geocode fallback also failed for ${shop.Name}: ${geoStatus}`);
                                }
                                resolve(); // Resolve after geocode attempt
                            });
                            return; // Important: return here because geocode is async, resolve is called within it
                        } else {
                             console.warn(`Could not get geometry for ${shop.Name} (ID: ${shop.GoogleProfileID}) and no address for fallback.`);
                        }
                    }
                    resolve(); // Resolve after Place Details attempt (or if no address fallback)
                });
            } else if (shop.Address && shop.Address !== 'N/A') {
                window.geocoder.geocode({ 'address': shop.Address + ', Maine, USA' }, (results, geoStatus) => {
                    if (geoStatus === 'OK' && results[0]?.geometry) {
                        shop.lat = results[0].geometry.location.lat();
                        shop.lng = results[0].geometry.location.lng();
                        // console.log(`Populated lat/lng for ${shop.Name} via Address.`);
                    } else {
                        console.warn(`Geocode failed for ${shop.Name} (Address: ${shop.Address}): ${geoStatus}`);
                    }
                    resolve(); // Resolve after geocode attempt
                });
            } else {
                console.warn(`Cannot determine Lat/Lng for ${shop.Name}: No PlaceID or Address.`);
                resolve(); // Resolve if no method to get lat/lng
            }
        });
    });
    await Promise.all(promises);
    console.log("Finished populating Lat/Lng for all shops.");
}





async function processAndPlotShops() {
    console.log("processAndPlotShops called");
    if (listingsContainer) listingsContainer.innerHTML = '<p class="text-center text-gray-700 p-4 col-span-1 md:col-span-2">Loading farm stands...</p>';

    allFarmStands = await fetchSheetData();
    if (allFarmStands.length === 0) {
        if (noResultsDiv) {
             noResultsDiv.textContent = (typeof GOOGLE_SHEET_DIRECT_URL !== 'undefined' && GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER) ? 'Data source not configured.' : 'No farm shops data found.';
             noResultsDiv.classList.remove('hidden');
        }
        if (listingsContainer) listingsContainer.classList.add('hidden');
        currentlyDisplayedShops = [];
        return;
    }
    
    // Populate lat/lng for all farm stands before any filtering or plotting
    await populateAllShopsWithLatLng(allFarmStands);
    
    currentlyDisplayedShops = [...allFarmStands]; 
    // Initial call to handleSearch will display all shops, sorted by distance to map center
    await handleSearch(); 
}




async function handleSearch() {
    console.log("handleSearch triggered.");
    let searchCenterLatLng = null;
    let selectedPlaceName = searchInput.value; // For logging

    // 1. Determine Search Center strictly from Autocomplete selection
    if (window.lastPlaceSelectedByAutocomplete &&
        window.lastPlaceSelectedByAutocomplete.geometry &&
        window.lastPlaceSelectedByAutocomplete.geometry.location) {

        searchCenterLatLng = window.lastPlaceSelectedByAutocomplete.geometry.location;
        selectedPlaceName = window.lastPlaceSelectedByAutocomplete.name || window.lastPlaceSelectedByAutocomplete.formatted_address || selectedPlaceName;
        console.log("Using autocomplete selection for search center:", selectedPlaceName, searchCenterLatLng.toString());
        // Map panning/zooming is handled by the 'place_changed' listener in mapLogic.js
    } else {
        if (searchInput.value.trim() === "") {
            console.log("Search input is empty. No location-based filter will be applied.");
        } else {
            console.warn("No valid autocomplete geometry for location-based filtering. Input:", searchInput.value);
        }
        // searchCenterLatLng remains null. Radius filter won't apply.
        // Any text-based filtering (if implemented) could still apply here.
    }

    let shopsToDisplay;

    // 2. Radius Filter (only if a search center was determined)
    if (searchCenterLatLng) {
        const RADIUS_MILES = 30; // This can be a constant from config.js
        const radiusMeters = RADIUS_MILES * 1609.344; // Miles to meters

        console.log(`Filtering shops within ${RADIUS_MILES} miles (${radiusMeters.toFixed(0)}m) of selected location.`);

        shopsToDisplay = allFarmStands.filter(shop => {
            if (shop.lat === undefined || shop.lng === undefined || shop.lat === null || shop.lng === null) {
                // console.warn(`Shop ${shop.Name} is missing lat/lng, cannot include in radius filter.`);
                return false;
            }
            try {
                // Ensure shop.lat and shop.lng are numbers
                const shopLat = parseFloat(shop.lat);
                const shopLng = parseFloat(shop.lng);
                if (isNaN(shopLat) || isNaN(shopLng)) {
                    // console.warn(`Shop ${shop.Name} has invalid lat/lng, cannot include in radius filter.`);
                    return false;
                }

                const shopLocation = new google.maps.LatLng(shopLat, shopLng);
                const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
                    searchCenterLatLng,
                    shopLocation
                );
                return distanceInMeters <= radiusMeters;
            } catch (e) {
                console.error("Error calculating distance for shop:", shop.Name, e);
                return false;
            }
        });
        console.log(`${shopsToDisplay.length} shops found within radius.`);
    } else {
        // No search center (e.g., input cleared, or invalid autocomplete, or initial load)
        // Show all farm stands (or apply other non-location filters if any).
        console.log("No search center for radius filter. Displaying all available farm stands.");
        shopsToDisplay = [...allFarmStands];
    }
    
    // Update global state of what's listed
    currentlyDisplayedShops = [...shopsToDisplay];

    // 3. Render listings and Plot markers
    // Sort by distance to the searchCenterLatLng if available, otherwise by map center.
    const sortCenter = searchCenterLatLng || (map ? map.getCenter() : null);
    renderListings(shopsToDisplay, true, sortCenter);
    plotMarkers(shopsToDisplay); // plotMarkers now expects shops to have lat/lng from populateAllShopsWithLatLng

    // The window.lastPlaceSelectedByAutocomplete is cleared at the start of the 'place_changed' listener,
    // so it's correctly handled for the next search.
}








// --- Event Listeners & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM element variables
    listingsContainer = document.getElementById('listingsContainer');
    searchInput = document.getElementById('searchInput');
    noResultsDiv = document.getElementById('noResults');
    listingsPanelElement = document.getElementById('listingsPanel');
    detailsOverlayShopElement = document.getElementById('detailsOverlayShop');
    closeDetailsOverlayShopButton = document.getElementById('closeDetailsOverlayShopButton');
    shopDetailNameElement = document.getElementById('shopDetailName');
    // shopDetailRatingStarsElement = document.getElementById('shopDetailRatingStars'); // Not used directly, handled in card
    // shopDetailAddressElement = document.getElementById('shopDetailAddress'); // Not used directly
    // shopDetailDistanceElement = document.getElementById('shopDetailDistance'); // Not used directly
    // shopDetailPhoneElement = document.getElementById('shopDetailPhone'); // Not used directly
    // shopDetailWebsiteElement = document.getElementById('shopDetailWebsite'); // Not used directly
    // shopDetailMapLinkContainerElement = document.getElementById('shopDetailMapLinkContainer'); // Not used directly
    detailsOverlaySocialElement = document.getElementById('detailsOverlaySocial');
    // closeDetailsOverlaySocialButton = document.getElementById('closeDetailsOverlaySocialButton'); // Already handled by general overlay close
    socialLinksContainerElement = document.getElementById('socialLinksContainer');
    twitterTimelineContainerElement = document.getElementById('twitterTimelineContainer');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            // If the user clears the input, reset the search to show all stands
            if (searchInput.value.trim() === "") {
                if (window.lastPlaceSelectedByAutocomplete) {
                    // console.log("Search input cleared, resetting autocomplete selection.");
                    window.lastPlaceSelectedByAutocomplete = null;
                }
                handleSearch(); // This will show all stands
            }
            // For other inputs, we wait for the 'place_changed' event from Autocomplete
        });
        // The 'place_changed' event (handled in mapLogic.js) is the primary trigger for searches
        // based on autocomplete selection. The Enter key behavior is largely managed by the
        // Autocomplete widget itself, which should trigger 'place_changed'.
    }

    if (closeDetailsOverlayShopButton) {
        closeDetailsOverlayShopButton.addEventListener('click', closeClickedShopOverlays);
    }
    // The social overlay does not have its own dedicated close button in the provided HTML,
    // but if it did, or if using a common close mechanism, it would be handled there.
    // The Escape key listener handles closing for both.

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const shopOverlayIsOpen = detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open');
            const socialOverlayIsOpen = detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open');
            if (shopOverlayIsOpen || socialOverlayIsOpen) {
                closeClickedShopOverlays();
            }
        }
    });

    console.log("DOM fully loaded. App setup initiated. Waiting for Google Maps API to call initAppMap.");
    // initAppMap will be called by the Google Maps API script callback
});