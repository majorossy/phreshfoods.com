'use strict';

// Google Maps API objects, defined globally within this module, initialized in initAppMap
var map; // 'var' for broader function scope for callback from Google Maps API script
var geocoder; // Google Maps Geocoder object (can be used for client-side geocoding if needed, but we prefer backend)
var placesService; // Google Maps PlacesService object (used for Autocomplete and potentially some client-side details)
var infowindow;
// var directionsService; // This Google object is not directly used for API calls anymore
var directionsRenderer; // This is used to RENDER directions on the map
var autocomplete; // For Google Places Autocomplete

// MAINE_BOUNDS_LITERAL should be defined in config.js if used by other files,
// or can stay here if only mapLogic uses it.
// For consistency, let's assume it's available from config.js if it was moved there.
// If not, define it here:
let MAINE_BOUNDS_LITERAL; // Declare with let if it might be reassigned
if (typeof window.MAINE_BOUNDS_LITERAL !== 'undefined') {
    MAINE_BOUNDS_LITERAL = window.MAINE_BOUNDS_LITERAL;
} else {
    MAINE_BOUNDS_LITERAL = {
        sw: { lat: 42.975426, lng: -71.089859 },
        ne: { lat: 47.459683, lng: -66.949829 },
    };
    console.warn("mapLogic.js: MAINE_BOUNDS_LITERAL was not found globally (from config.js), using local default.");
}


function initAppMap() {
    console.log("mapLogic.js: initAppMap callback fired.");
    if (!window.AppState || !window.AppState.dom || !AppState.dom.mapElement) {
        console.warkn("mapLogic.js: AppState.dom.mapElement not ready. Deferring map initialization slightly...");
        setTimeout(initAppMap, 100); // Increased delay slightly
        return;
    }

    console.log("mapLogic.js: AppState.dom.mapElement IS ready.");
    const dom = AppState.dom;

    // Constants from config.js
    const activeMapStyles = USE_CUSTOM_MAP_STYLE ? mapStyles.maineLicensePlate : null;

    map = new google.maps.Map(dom.mapElement, {
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        mapTypeControl: false,
        styles: activeMapStyles,
        gestureHandling: "greedy",
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        rotateControl: false,
        scaleControl: true,
    });

    // These are still useful for client-side operations like Autocomplete or LatLng object creation
    window.geocoder = new google.maps.Geocoder(); // Keep for potential client-side utility, though API calls are proxied
    placesService = new google.maps.places.PlacesService(map); // Keep for Autocomplete and client-side PlacesService operations

    infowindow = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0, -15),
        disableAutoPan: false
    });

    google.maps.event.addListener(infowindow, 'domready', () => {
        const iwContainer = infowindow.div;
        if (!iwContainer) return;
        const tailAndCloseContainer = iwContainer.querySelector('.gm-style-iw-chr');
        if (tailAndCloseContainer) tailAndCloseContainer.style.display = 'none';
        const closeButton = iwContainer.querySelector('button.gm-ui-hover-effect');
        if (closeButton) closeButton.style.display = 'none';
        const contentWrapper = iwContainer.querySelector('.gm-style-iw-d');
        if(contentWrapper) contentWrapper.style.overflow = 'hidden';
    });

    // directionsService = new google.maps.DirectionsService(); // Not directly used for API calls now
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: { strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 6 },
    });

    if (dom.directionsPanel) {
        directionsRenderer.setPanel(dom.directionsPanel);
    } else {
        console.warn("mapLogic.js: Directions panel div not found in AppState.dom.");
    }

    if (dom.searchInput) {
        const autocompleteOptions = {
            bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(MAINE_BOUNDS_LITERAL.sw.lat, MAINE_BOUNDS_LITERAL.sw.lng),
                new google.maps.LatLng(MAINE_BOUNDS_LITERAL.ne.lat, MAINE_BOUNDS_LITERAL.ne.lng)
            ),
            strictBounds: true,
            componentRestrictions: { country: "us" },
            fields: ["name", "formatted_address", "geometry", "address_components", "place_id", "types"],
        };
        autocomplete = new google.maps.places.Autocomplete(dom.searchInput, autocompleteOptions);

        autocomplete.addListener("place_changed", () => {
            AppState.lastPlaceSelectedByAutocomplete = null;
            const place = autocomplete.getPlace();

            if (!place?.geometry?.location) {
                console.warn("Autocomplete: Place invalid or no geometry for input:", dom.searchInput.value);
                // Keep user's typed text if place is invalid
                if (typeof handleSearch === "function") handleSearch(); // Trigger search with typed text
                return;
            }

            let displayAddress = place.formatted_address || place.name || dom.searchInput.value;
            if (place.formatted_address) {
                displayAddress = displayAddress.replace(/, USA$/, "").trim(); // Remove ", USA"
            }
            dom.searchInput.value = displayAddress;
            AppState.lastPlaceSelectedByAutocomplete = place; // Store the full Place object

            const targetLocation = place.geometry.location;
            map.setCenter(getAdjustedMapCenter(targetLocation));
            map.setZoom(DEFAULT_MAP_ZOOM); // Or a more specific zoom based on place.types

            if (typeof handleSearch === "function") handleSearch();
        });
    }

    map.addListener("click", (e) => {
        if (e.placeId) e.stop(); // Stop click propagation if it was on a map POI
        if (AppState.markerClickedRecently) return;
        if (infowindow) infowindow.close();
        // If overlays are open and user clicks map, close them and navigate to root
        if (AppState.dom.detailsOverlayShopElement?.classList.contains("is-open") ||
            AppState.dom.detailsOverlaySocialElement?.classList.contains("is-open")) {
            if (typeof closeClickedShopOverlaysAndNavigateHome === "function") { // from uiLogic.js
                closeClickedShopOverlaysAndNavigateHome();
            }
        }
    });

    map.addListener("idle", () => {
        const currentMapCenter = map.getCenter();
        // Re-sort listings by distance if map is moved manually and no specific search was made
        if (currentMapCenter && AppState.currentlyDisplayedShops && typeof renderListings === "function") {
            if (!AppState.lastPlaceSelectedByAutocomplete?.geometry) { // Only if not an autocomplete search result
                renderListings(AppState.currentlyDisplayedShops, true, currentMapCenter);
            }
        }
    });

    map.setCenter(getAdjustedMapCenter(DEFAULT_MAP_CENTER));

    if (typeof processAndPlotShops === "function") { // From main.js
        processAndPlotShops();
    } else {
        console.error("mapLogic.js: processAndPlotShops function not found.");
    }
}

async function calculateAndDisplayRoute(destinationShopData) {
    const dom = AppState.dom;
    if (!directionsRenderer) { console.error("Directions Renderer not initialized."); alert("Directions service is unavailable."); return; }
    if (!destinationShopData) { console.error("Directions: No destination data provided."); alert("Destination needed for directions."); return; }

    directionsRenderer.setDirections({ routes: [] }); // Clear previous route
    if (dom.directionsPanel) dom.directionsPanel.innerHTML = "";

    let origin;
    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) {
        const loc = AppState.lastPlaceSelectedByAutocomplete.geometry.location;
        origin = `${loc.lat()},${loc.lng()}`;
    } else if (dom.searchInput?.value.trim()) {
        origin = dom.searchInput.value.trim();
    } else {
        const fallbackOrigin = prompt("Please enter your starting address for directions:", `${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.lng}`);
        if (!fallbackOrigin) { alert("Starting location is needed for directions."); return; }
        origin = fallbackOrigin;
    }

    let destinationApiArg;
    if (destinationShopData.lat && destinationShopData.lng) {
        destinationApiArg = `${parseFloat(destinationShopData.lat)},${parseFloat(destinationShopData.lng)}`;
    } else if (destinationShopData.GoogleProfileID) {
        destinationApiArg = `place_id:${destinationShopData.GoogleProfileID}`;
    } else if (destinationShopData.Address && destinationShopData.Address !== 'N/A') {
        destinationApiArg = destinationShopData.Address;
    } else {
        alert(`Cannot get directions to "${destinationShopData.Name || "the selected shop"}" due to missing location information.`);
        return;
    }

    try {
        const directionsResult = await getDirectionsClient(origin, destinationApiArg); // from apiService.js
        if (directionsResult && directionsResult.status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(directionsResult);
            if(dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.add('hidden');
            if(dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.remove('hidden');
            if (directionsResult.routes?.[0]?.legs?.[0]?.start_location && map) {
                 const startLocLatLng = new google.maps.LatLng(
                     directionsResult.routes[0].legs[0].start_location.lat,
                     directionsResult.routes[0].legs[0].start_location.lng
                 );
                map.panTo(getAdjustedMapCenter(startLocLatLng));
                // Optionally fit bounds: map.fitBounds(getAdjustedBounds(directionsResult.routes[0].bounds));
            }
        } else {
            window.alert("Directions request failed: " + (directionsResult ? directionsResult.status : "Unknown error from server."));
            console.error("Directions request failed:", directionsResult);
        }
    } catch (error) {
        window.alert("Error calculating directions: " + error.message);
        console.error("Error in calculateAndDisplayRoute:", error);
    }
}

function clearDirections() {
    const dom = AppState.dom;
    if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
    if (dom.directionsPanel) dom.directionsPanel.innerHTML = "";
    if(dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.remove('hidden');
    if(dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.add('hidden');
    console.log("mapLogic: Directions cleared.");
}

function plotMarkers(shopsToPlot) {
    console.log("[mapLogic - plotMarkers] CALLED. Shops received:", shopsToPlot ? shopsToPlot.length : 'N/A'); // Should match log from main.js

    // Clear existing markers
    (AppState.allFarmStands || []).forEach(s => { if (s.marker) { s.marker.setMap(null); s.marker = null; } });

    if (!shopsToPlot || shopsToPlot.length === 0) {
        console.log("[mapLogic - plotMarkers] No shops to plot. Exiting.");
        return;
    }

    shopsToPlot.forEach(shop => {
        if (shop.lat != null && shop.lng != null) { // Ensure lat/lng are present
            // --- START DEBUG LOG FOR INDIVIDUAL MARKER CREATION ---
            console.log(`[mapLogic - plotMarkers] About to call createMarkerForShop for: ${shop.Name} (Lat: ${shop.lat}, Lng: ${shop.lng})`);
            // --- END DEBUG LOG ---
            createMarkerForShop(shop);
        } else {
            console.warn(`[mapLogic - plotMarkers] SKIPPING marker for ${shop.Name} due to missing lat/lng.`);
        }
    });
}

function createMarkerForShop(shop) {
    console.log(`[mapLogic - createMarkerForShop] CALLED for: ${shop.Name}`); // Confirm it's entered

    const lat = parseFloat(shop.lat);
    const lng = parseFloat(shop.lng);

    if (isNaN(lat) || isNaN(lng)) {
        console.warn(`[mapLogic - createMarkerForShop] Invalid lat/lng for ${shop.Name}. Parsed Lat: ${lat}, Lng: ${lng}. SKIPPING.`);
        return;
    }

    // Check if the 'map' object (global in this file, from initAppMap) is available
    if (typeof map === 'undefined' || !map) {
        console.error("[mapLogic - createMarkerForShop] CRITICAL: Google Maps 'map' object is NOT defined. Cannot create marker.");
        return;
    }
    console.log("[mapLogic - createMarkerForShop] 'map' object IS defined.");


    const iconConfig = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: markerColor,
        fillOpacity: 0.9,
        strokeColor: "#ffffff",
        strokeWeight: 1.5,
        scale: 8,
    };
    console.log(`[mapLogic - createMarkerForShop] Icon config for ${shop.Name}:`, JSON.stringify(iconConfig));

    try {
        shop.marker = new google.maps.Marker({
            position: { lat, lng },
            map: map, // Crucial: the map instance
            title: shop.Name,
            icon: iconConfig,
            zIndex: 1
        });
        console.log(`[mapLogic - createMarkerForShop] SUCCESS: Marker created for ${shop.Name} at ${lat}, ${lng}`);
    } catch (error) {
        console.error(`[mapLogic - createMarkerForShop] ERROR creating marker for ${shop.Name}:`, error);
    }

    shop.marker.addListener("click", () => {
        AppState.markerClickedRecently = true;
        if (shop.marker) shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);

// --- MODIFICATION TO CHANGE URL ON MARKER CLICK ---
    if (shop.slug && typeof navigateToStoreBySlug === 'function') {
        navigateToStoreBySlug(shop); // This will handle opening overlays, map pan, and InfoWindow via the routing flow
    } else {
        // Fallback if no slug or navigation function: just open overlays and infowindow
        console.warn("Marker click: Shop missing slug or navigateToStoreBySlug not defined. Opening overlays directly.", shop);
        if (typeof openClickedShopOverlays === 'function') {
            openClickedShopOverlays(shop);
        }
        setTimeout(() => {
            showInfoWindowForShop(shop);
        }, 100);
    }
    // --- END MODIFICATION ---

        setTimeout(() => { AppState.markerClickedRecently = false; }, 300);
    });
}

async function showInfoWindowForShop(shop) {
    if (!shop) { console.error("[mapLogic - showInfoWindowForShop] No shop provided. Exiting."); return; }
    console.log(`[mapLogic - showInfoWindowForShop] CALLED for shop: ${shop.Name}`); // <<<< CONFIRM ENTRY

    const position = shop.marker?.getPosition() ||
                     (shop.lat != null && shop.lng != null ? { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng) } : null);

    if (!position) {
        console.warn(`[mapLogic - showInfoWindowForShop] No valid position for ${shop.Name}. Cannot open InfoWindow.`);
        if (infowindow) infowindow.close();
        return;
    }
    console.log(`[mapLogic - showInfoWindowForShop] Position for InfoWindow:`, position.lat, position.lng);


    if (!map) { // <<<< ADD THIS CHECK
        console.error("[mapLogic - showInfoWindowForShop] 'map' object is undefined! Cannot open InfoWindow.");
        return;
    }
    if (!infowindow) { // <<<< ADD THIS CHECK
        console.error("[mapLogic - showInfoWindowForShop] 'infowindow' object is undefined! Cannot open InfoWindow.");
        // Attempt to reinitialize, though it should be done in initAppMap
        // infowindow = new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -15) });
        // If you reinitialize here, you might miss the 'domready' listener setup from initAppMap.
        return;
    }
    console.log("[mapLogic - showInfoWindowForShop] 'map' and 'infowindow' objects seem OK.");

    // map.panTo(getAdjustedMapCenter(position)); // You can enable this if needed, but let's see if content loads first
    infowindow.close(); // Close any existing one

    // Highlight logic - This seems fine
    (AppState.allFarmStands || []).forEach(s => { if (s.marker && s !== shop) s.marker.setZIndex(1); });
    if (shop.marker) shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);


    // --- Logic to fetch Place Details if needed (already reviewed, should be mostly fine) ---
    if (shop.GoogleProfileID && (!shop.placeDetails || shop.placeDetails.rating === undefined)) {
        console.log(`[mapLogic - InfoWindow] Fetching details for ${shop.Name} via backend.`);
        const placeDetails = await getPlaceDetailsClient(shop.GoogleProfileID, 'name,rating,user_ratings_total,formatted_address,website');
        if (placeDetails) {
            shop.placeDetails = { ...(shop.placeDetails || {}), ...placeDetails };
            console.log(`[mapLogic - InfoWindow] Details fetched successfully for ${shop.Name}.`);
        } else {
            console.warn(`[mapLogic - InfoWindow] Place Details fetch via backend failed for ${shop.Name}.`);
        }
    } else {
        console.log(`[mapLogic - InfoWindow] Using existing/no GoogleProfileID for ${shop.Name}. Details:`, shop.placeDetails);
    }
    // --- End Place Details Logic ---


    if (typeof generateShopContentHTML === 'function') {
        console.log("[mapLogic - showInfoWindowForShop] Attempting to generate InfoWindow content...");
        let content = ''; // Initialize content
        try {
            content = generateShopContentHTML(shop, 'infowindow'); // CALLING uiLogic.js
            console.log("[mapLogic - showInfoWindowForShop] Content generated (first 100 chars):", content ? content.substring(0,100) : "EMPTY_CONTENT");
        } catch (e) {
            console.error("[mapLogic - showInfoWindowForShop] ERROR during generateShopContentHTML for InfoWindow:", e);
            content = `<div style="padding:10px; color:red;">Error generating shop details for InfoWindow.</div>`;
        }

        if (content && content.trim() !== "") {
            infowindow.setContent(content);
            console.log("[mapLogic - showInfoWindowForShop] Setting content and opening InfoWindow...");
            infowindow.open({ anchor: shop.marker, map: map, shouldFocus: false });
            console.log("[mapLogic - showInfoWindowForShop] InfoWindow.open() called.");
        } else {
            console.warn("[mapLogic - showInfoWindowForShop] generateShopContentHTML returned empty or whitespace content. Not opening InfoWindow.");
        }
    } else {
        console.error("[mapLogic - showInfoWindowForShop] generateShopContentHTML function not found (expected in uiLogic.js).");
    }
}

function getAdjustedMapCenter(targetCenterInput) {
    const dom = AppState.dom;
    if (!map?.getDiv || !map.getBounds() || !map.getProjection()) return targetCenterInput;

    let targetLat, targetLng;
    if (targetCenterInput?.lat && typeof targetCenterInput.lat === 'function') { // Google LatLng object
        targetLat = targetCenterInput.lat();
        targetLng = targetCenterInput.lng();
    } else if (targetCenterInput?.lat && typeof targetCenterInput.lat === 'number') { // Plain {lat, lng} object
        targetLat = targetCenterInput.lat;
        targetLng = targetCenterInput.lng;
    } else { // Fallback to current map center or default
        const currentMapCenter = map.getCenter();
        if (!currentMapCenter) return DEFAULT_MAP_CENTER; // DEFAULT_MAP_CENTER from config.js
        return { lat: currentMapCenter.lat(), lng: currentMapCenter.lng() };
    }

    const mapDiv = map.getDiv();
    const mapWidthPx = mapDiv.offsetWidth;
    let panelLeftPx = 0;
    let panelRightPx = 0;

    if (dom.detailsOverlaySocialElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlaySocialElement).display !== "none") {
        panelLeftPx = dom.detailsOverlaySocialElement.offsetWidth;
    }
    if (dom.detailsOverlayShopElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlayShopElement).display !== "none") {
        panelRightPx = dom.detailsOverlayShopElement.offsetWidth;
    } else if (dom.listingsPanelElement && getComputedStyle(dom.listingsPanelElement).display !== "none" && dom.listingsPanelElement.offsetWidth > 0 && window.innerWidth >= 768) { // md breakpoint
        panelRightPx = dom.listingsPanelElement.offsetWidth;
    }

    if ((panelLeftPx <= 0 && panelRightPx <= 0) || mapWidthPx <= 0) {
        return { lat: targetLat, lng: targetLng };
    }

    const netPixelShift = (panelLeftPx - panelRightPx) / 2; // Positive shifts right, negative shifts left
    const currentMapBounds = map.getBounds();
    if (!currentMapBounds) return { lat: targetLat, lng: targetLng }; // Should not happen if map is initialized

    const lngSpan = currentMapBounds.toSpan().lng();
    const degreesPerPixelLng = lngSpan / mapWidthPx;
    
    return { lat: targetLat, lng: targetLng - (netPixelShift * degreesPerPixelLng) };
}

function getAdjustedBounds(originalBounds) {
    const dom = AppState.dom;
    if (!map?.getDiv || !originalBounds || !map.getProjection || typeof map.getZoom !== 'function') {
        return originalBounds;
    }

    const mapDiv = map.getDiv();
    const mapWidth = mapDiv.offsetWidth;
    let panelLeftOffset = 0;
    let panelRightOffset = 0;

    if (dom.detailsOverlaySocialElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlaySocialElement).display !== "none") {
        panelLeftOffset = dom.detailsOverlaySocialElement.offsetWidth;
    }
    if (dom.detailsOverlayShopElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlayShopElement).display !== "none") {
        panelRightOffset = dom.detailsOverlayShopElement.offsetWidth;
    } else if (dom.listingsPanelElement && getComputedStyle(dom.listingsPanelElement).display !== "none" && dom.listingsPanelElement.offsetWidth > 0 && window.innerWidth >= 768) { // md breakpoint
        panelRightOffset = dom.listingsPanelElement.offsetWidth;
    }

    if ((panelLeftOffset <= 0 && panelRightOffset <= 0) || mapWidth <= 0) {
        return originalBounds;
    }

    const projection = map.getProjection();
    const zoom = map.getZoom();
    if (!projection || typeof zoom === "undefined") return originalBounds;

    const sw = originalBounds.getSouthWest();
    const ne = originalBounds.getNorthEast();
    if (!sw || !ne) { console.warn("AdjustBounds: Invalid SW/NE from originalBounds."); return originalBounds; }

    const swPoint = projection.fromLatLngToPoint(sw);
    const nePoint = projection.fromLatLngToPoint(ne);
    if (!swPoint || !nePoint) { console.warn("AdjustBounds: Invalid points from projection."); return originalBounds; }

    // Calculate how many "world units" (used by projection) correspond to one pixel at current zoom
    const worldUnitsPerPixel = Math.pow(2, -zoom); // This is a simplification, actual scale depends on projection details

    // Calculate the horizontal shift needed in world units
    // If right panel is open, we need to shift the viewable bounds to the left (decrease x)
    // If left panel is open, we need to shift viewable bounds to the right (increase x)
    // The net effect on the center is (panelRight - panelLeft) / 2.
    // So, to adjust bounds, we shift both SW and NE points by this amount.
    const pixelShiftForBounds = (panelRightOffset - panelLeftOffset) / 2; // Positive means map content effectively shifts left
    const worldOffsetX = pixelShiftForBounds * worldUnitsPerPixel;

    const newSw = projection.fromPointToLatLng(new google.maps.Point(swPoint.x + worldOffsetX, swPoint.y));
    const newNe = projection.fromPointToLatLng(new google.maps.Point(nePoint.x + worldOffsetX, nePoint.y));

    if (newSw && newNe) {
        return new google.maps.LatLngBounds(newSw, newNe);
    }
    console.warn("AdjustBounds: Failed to create new LatLngBounds from adjusted points.");
    return originalBounds;
}