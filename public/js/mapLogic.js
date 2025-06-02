// public/js/mapLogic.js
'use strict';

const DEBUG_MAP_LOGIC = true;

function mapDebugLog(...args) { if (DEBUG_MAP_LOGIC) console.log('[MapLogic-DEBUG]', ...args); }
function mapDebugWarn(...args) { if (DEBUG_MAP_LOGIC) console.warn('[MapLogic-WARN]', ...args); }
function mapDebugError(...args) { if (DEBUG_MAP_LOGIC) console.error('[MapLogic-ERROR]', ...args); }

var map;
var infowindow;
var directionsRenderer;
// window.geocoder set in performMapSetup

let mapApiLoadedAndCallbackFired = false;
let performMapSetupPromise = null; // To make performMapSetup awaitable if called multiple times

async function performMapSetup() {
    mapDebugLog("performMapSetup: Attempting actual map setup.");
    if (!window.AppState || !AppState.domReadyAndPopulated || !AppState.dom.mapElement) {
        mapDebugWarn("performMapSetup: Pre-conditions not met (AppState, DOM not ready).");
        return Promise.reject("PerformMapSetup pre-conditions not met."); // Return a rejected promise
    }
    if (map) { // Already initialized
        mapDebugLog("performMapSetup: Map already exists. Resolving.");
        return Promise.resolve(); // Already done
    }

    const dom = AppState.dom;

    // Use MAINE_BOUNDS_LITERAL directly from config.js (ensure config.js loaded first)
    const boundsForSetup = (typeof MAINE_BOUNDS_LITERAL !== 'undefined') ? MAINE_BOUNDS_LITERAL : 
        { sw: { lat: 42.975426, lng: -71.089859 }, ne: { lat: 47.459683, lng: -66.949829 } };
    if (typeof MAINE_BOUNDS_LITERAL === 'undefined') {
        mapDebugWarn("performMapSetup: MAINE_BOUNDS_LITERAL (from config.js) not found. Using fallback.");
    }
    
    const activeMapStyles = (typeof USE_CUSTOM_MAP_STYLE !== 'undefined' && USE_CUSTOM_MAP_STYLE && typeof mapStyles !== 'undefined') ? mapStyles.maineLicensePlate : null;
    
    // Determine center: if AppState.lastPlaceSelectedByAutocomplete exists (from cookie or slug), use it. Else, default.
    let initialMapCenter;
    let initialMapZoom;

    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) {
        initialMapCenter = AppState.lastPlaceSelectedByAutocomplete.geometry.location; // This is a LatLngLiteral
        initialMapZoom = USER_LOCATION_MAP_ZOOM || 17; // Zoom in if specific location
        mapDebugLog("performMapSetup: Using location from AppState.lastPlaceSelectedByAutocomplete for initial center.");
    } else {
        initialMapCenter = DEFAULT_MAP_CENTER || { lat: 43.6926, lng: -70.2537 };
        initialMapZoom = DEFAULT_MAP_ZOOM || 10; // More zoomed out for default
        mapDebugLog("performMapSetup: Using DEFAULT_MAP_CENTER for initial center.");
    }


    try {
        map = new google.maps.Map(dom.mapElement, {
            center: initialMapCenter, // Use determined initial center
            zoom: initialMapZoom,     // Use determined initial zoom
            mapTypeControl: false, styles: activeMapStyles,
            gestureHandling: "greedy", zoomControl: true, streetViewControl: false, fullscreenControl: true,
            rotateControl: false, scaleControl: true,
            restriction: { latLngBounds: boundsForSetup, strictBounds: false },
            mapId: typeof MAP_ID !== 'undefined' ? MAP_ID : undefined
        });
        mapDebugLog("performMapSetup: Google Map object CREATED successfully.");
    } catch (error) {
        mapDebugError("performMapSetup: CRITICAL ERROR creating Google Map object.", error);
        if(dom.mapElement) dom.mapElement.innerHTML = "<p style='color:red; text-align:center;'>Map init error.</p>";
        return Promise.reject(error); // Propagate error
    }

    window.geocoder = new google.maps.Geocoder();
    infowindow = new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -15), disableAutoPan: false });
    google.maps.event.addListener(infowindow, 'domready', () => { /* ... IW styling ... */ });
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map, polylineOptions: { strokeColor: "#FF0000" }});
    if (dom.directionsPanel) directionsRenderer.setPanel(dom.directionsPanel);

    const mainSearchAutocompleteElement = dom.searchAutocompleteElement;
    if (mainSearchAutocompleteElement) {
        if (boundsForSetup) {
            const biasRect = `rectangle:${boundsForSetup.sw.lat},${boundsForSetup.sw.lng},${boundsForSetup.ne.lat},${boundsForSetup.ne.lng}`;
            if (!mainSearchAutocompleteElement.getAttribute('location-bias')) mainSearchAutocompleteElement.locationBias = biasRect;
            if (!mainSearchAutocompleteElement.getAttribute('location-restriction')) mainSearchAutocompleteElement.locationRestriction = biasRect;
        }
        // ... (other attributes for mainSearchAutocompleteElement)
        mainSearchAutocompleteElement.addEventListener('gmp-select', () => {
            const place = mainSearchAutocompleteElement.place; 
            if (!place?.geometry?.location) { AppState.lastPlaceSelectedByAutocomplete = null; if (typeof handleSearch === "function") handleSearch(); return; }
            AppState.lastPlaceSelectedByAutocomplete = place;
            if (typeof handleSearch === "function") handleSearch();
        });
    }
    map.addListener("click", (e) => { /* ... as before ... */ });
    map.addListener("idle", () => { /* ... as before ... */ });
    
    // processAndPlotShops will be called by handleSearch or other triggers now,
    // especially after map is confirmed ready and a location context is set.
    // If map was loaded due to cookie or slug, handleSearch will be called soon by main.js or router.
    // If map was loaded due to modal, modalLogic.js calls handleSearch.
    // If initial map load for "all" (modal skip with no search), handleSearch will be called.
    if (typeof processAndPlotShops === "function") {
        // Instead of calling directly, let the standard flow (handleSearch after location context) manage it.
        // processAndPlotShops(); // This might be redundant if handleSearch is called by the initiator
        mapDebugLog("performMapSetup: Map setup done. processAndPlotShops will be triggered by search/routing logic.");
    } else {
        mapDebugError("performMapSetup: CRITICAL - processAndPlotShops function NOT FOUND.");
    }
    mapDebugLog("performMapSetup: Map setup sequence COMPLETE.");
    return Promise.resolve(); // Successfully set up
}

async function initAppMap() {
    mapDebugLog("initAppMap (API Callback): Google Maps API script loaded and callback fired.");
    if (!google || !google.maps || !google.maps.importLibrary) { /* ... error handling ... */ return; }

    try {
        await google.maps.importLibrary("maps");
        await google.maps.importLibrary("places"); 
        await google.maps.importLibrary("marker");
        await google.maps.importLibrary("geocoding"); 
        await google.maps.importLibrary("geometry"); 
        mapDebugLog("[initAppMap] All Google Maps libraries imported successfully.");

        mapApiLoadedAndCallbackFired = true; 
        if (window.AppState) AppState.mapsApiReady = true;

        // Call attemptMapInitialization. If called by other flows (e.g. modal submission),
        // this ensures the API ready flag is set for it.
        // attemptMapInitialization itself checks if map is already being/been set up.
        attemptMapInitialization(); 

        // Modal autocomplete listeners are primarily handled by modalLogic.js now,
        // which checks AppState.mapsApiReady.
        // However, if modalLogic.js's initializeModalLogic ran *before* API was ready,
        // this provides a second chance to set up the listeners.
        if (window.AppState && AppState.domReadyAndPopulated && typeof setupModalAutocompleteEventListeners === "function") {
            mapDebugLog("[initAppMap] API Ready: Checking if modal listeners need setup.");
            setupModalAutocompleteEventListeners(); // From modalLogic.js
        }
    } catch (error) { /* ... error handling ... */ }
}

// This function is now more of a robust gatekeeper for performMapSetup
// It returns a promise that resolves when setup is complete or rejects on failure.
function attemptMapInitialization() {
    mapDebugLog("attemptMapInitialization. API Loaded:", mapApiLoadedAndCallbackFired, "DOM Ready:", window.AppState?.domReadyAndPopulated);
    
    // If setup is already in progress or done, return that promise
    if (performMapSetupPromise) {
        mapDebugLog("attemptMapInitialization: performMapSetup already in progress or completed.");
        return performMapSetupPromise;
    }

    if (mapApiLoadedAndCallbackFired && window.AppState?.domReadyAndPopulated) {
        if (map) { 
            mapDebugLog("attemptMapInitialization: Map object already exists. Resolving.");
            return Promise.resolve(); // Already initialized
        }
        mapDebugLog("attemptMapInitialization: All conditions met. Proceeding to performMapSetup.");
        performMapSetupPromise = performMapSetup(); // Store the promise
        return performMapSetupPromise;
    } else {
        mapDebugLog("attemptMapInitialization: Conditions not yet met. Map setup deferred.");
        return Promise.reject("Map initialization pre-conditions not met."); // Or resolve if it's okay to not have map yet
    }
}

// --- Other map functions (calculateAndDisplayRoute, etc.) ---
// These remain the same as in your provided mapLogic.js
async function calculateAndDisplayRoute(destinationShopData) { /* ... Full function ... */ 
    mapDebugLog("calculateAndDisplayRoute CALLED. Destination:", destinationShopData);
    const dom = AppState.dom;
    if (!directionsRenderer) { /* ... error ... */ return; }
    if (!destinationShopData) { /* ... error ... */ return; }
    directionsRenderer.setDirections({ routes: [] });
    if (dom.directionsPanel) dom.directionsPanel.innerHTML = "";
    let origin;
    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) {
        const loc = AppState.lastPlaceSelectedByAutocomplete.geometry.location;
        origin = (typeof loc.lat === 'function') ? `${loc.lat()},${loc.lng()}` : `${loc.lat},${loc.lng}`;
    } else if (dom.searchAutocompleteElement?.value.trim()) {
        origin = dom.searchAutocompleteElement.value.trim();
    } else {
        const fallbackOrigin = prompt("Please enter your starting address:", `${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.lng}`);
        if (!fallbackOrigin) { return; } origin = fallbackOrigin;
    }
    let destinationApiArg;
    if (destinationShopData.lat && destinationShopData.lng) destinationApiArg = { lat: parseFloat(destinationShopData.lat), lng: parseFloat(destinationShopData.lng) };
    else if (destinationShopData.GoogleProfileID) destinationApiArg = { placeId: destinationShopData.GoogleProfileID };
    else if (destinationShopData.Address && destinationShopData.Address !== 'N/A') destinationApiArg = destinationShopData.Address;
    else { alert(`Cannot get directions to "${escapeHTML(destinationShopData.Name || "shop")}"`); return; }
    try {
        const directionsResult = await getDirectionsClient(origin, destinationApiArg);
        if (directionsResult && directionsResult.status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(directionsResult);
            if (dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.add('hidden');
            if (dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.remove('hidden');
            if (directionsResult.routes?.[0]?.legs?.[0]?.start_location && map) {
                 const startLoc = directionsResult.routes[0].legs[0].start_location;
                 map.panTo(getAdjustedMapCenter(new google.maps.LatLng(startLoc.lat(), startLoc.lng())));
            }
        } else { window.alert("Directions request failed: " + (directionsResult?.status || "Unknown")); }
    } catch (error) { window.alert("Error calculating directions: " + error.message); }
}
function clearDirections() { /* ... Full function ... */ 
    mapDebugLog("clearDirections CALLED.");
    const dom = AppState.dom;
    if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
    if (dom.directionsPanel) dom.directionsPanel.innerHTML = "";
    if (dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.remove('hidden');
    if (dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.add('hidden');
}
function plotMarkers(shopsToPlot) { /* ... Full function ... */ 
    mapDebugLog("plotMarkers CALLED. shopsToPlot count:", shopsToPlot?.length ?? 'N/A');
    (AppState.allFarmStands || []).forEach(s => { if (s.marker) { s.marker.map = null; s.marker = null; }});
    if (!shopsToPlot || shopsToPlot.length === 0) return;
    shopsToPlot.forEach((shop) => { if (shop.lat != null && shop.lng != null) createMarkerForShop(shop); });
}
async function createMarkerForShop(shop) { /* ... Full function ... */ 
    const lat = parseFloat(shop.lat), lng = parseFloat(shop.lng);
    if (isNaN(lat) || isNaN(lng) || !map || !google.maps.marker?.AdvancedMarkerElement) return;
    const markerElement = document.createElement('div');
    markerElement.style.width = '16px'; markerElement.style.height = '16px'; markerElement.style.borderRadius = '50%';
    markerElement.style.backgroundColor = markerColor || '#FF0000';
    markerElement.style.border = '1.5px solid #ffffff'; markerElement.style.opacity = '0.9';
    markerElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; markerElement.style.cursor = 'pointer';
    try {
        shop.marker = new google.maps.marker.AdvancedMarkerElement({ position: { lat, lng }, map: map, title: shop.Name, content: markerElement, zIndex: 1 });
    } catch (error) { return; }
    if (!shop.marker) return;
    shop.marker.addListener("gmp-click", () => {
        AppState.markerClickedRecently = true; if (shop.marker) shop.marker.zIndex = 1000;
        if (shop.slug && typeof navigateToStoreBySlug === 'function') navigateToStoreBySlug(shop);
        else { if (typeof openClickedShopOverlays === 'function') openClickedShopOverlays(shop); setTimeout(() => { if (typeof showInfoWindowForShop === 'function') showInfoWindowForShop(shop); }, 100); }
        setTimeout(() => { AppState.markerClickedRecently = false; }, 300);
    });
}
async function showInfoWindowForShop(shop) { /* ... Full function ... */ 
    if (!shop || !map || !infowindow) return;
    const position = shop.marker?.position || (shop.lat != null && shop.lng != null ? { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng) } : null);
    if (!position) { infowindow.close(); return; }
    infowindow.close();
    (AppState.allFarmStands || []).forEach(s => { if (s.marker && s !== shop) s.marker.zIndex = 1; });
    if (shop.marker) shop.marker.zIndex = 1000;
    let fieldsToFetch = [];
    if (!shop.placeDetails?.reviews) fieldsToFetch.push('reviews');
    if (!shop.placeDetails?.url) fieldsToFetch.push('url');
    if (shop.GoogleProfileID && fieldsToFetch.length > 0 && typeof getPlaceDetailsClient === 'function') {
        try {
            const newDetails = await getPlaceDetailsClient(shop.GoogleProfileID, fieldsToFetch.join(','));
            if (newDetails) shop.placeDetails = { ...(shop.placeDetails || {}), ...newDetails };
        } catch (e) { /* ignore */ }
    }
    if (typeof generateShopContentHTML === 'function') {
        let content = generateShopContentHTML(shop, 'infowindow');
        if (content?.trim()) {
            infowindow.setContent(content);
            infowindow.open({ anchor: shop.marker || undefined, map: map, shouldFocus: false });
            if (!shop.marker) infowindow.setPosition(position);
        }
    }
}
function getAdjustedMapCenter(targetCenterInput) { /* ... Full function ... */ 
    const dom = AppState.dom;
    if (!map?.getDiv || !map.getBounds() || !map.getProjection()) return targetCenterInput; 
    let targetLat, targetLng;
    if (targetCenterInput && typeof targetCenterInput.lat === 'function') { targetLat = targetCenterInput.lat(); targetLng = targetCenterInput.lng(); }
    else if (targetCenterInput && typeof targetCenterInput.lat === 'number') { targetLat = targetCenterInput.lat; targetLng = targetCenterInput.lng; }
    else { const mc = map.getCenter(); return mc ? { lat: mc.lat(), lng: mc.lng() } : (DEFAULT_MAP_CENTER || { lat: 0, lng: 0}); }
    const mapWidthPx = map.getDiv().offsetWidth; let panelLeftPx = 0; let panelRightPx = 0;
    const socialPanel = dom.detailsOverlaySocialElement; 
    if (socialPanel?.classList.contains('is-open') && socialPanel.offsetParent) panelLeftPx = socialPanel.offsetWidth;
    const shopPanel = dom.detailsOverlayShopElement;
    if (shopPanel?.classList.contains('is-open') && shopPanel.offsetParent) panelRightPx = shopPanel.offsetWidth;
    else { const listingsPanel = dom.listingsPanelElement; if (listingsPanel && getComputedStyle(listingsPanel).display !== "none" && window.innerWidth >= 768) panelRightPx = listingsPanel.offsetWidth; }
    if ((panelLeftPx <= 0 && panelRightPx <= 0) || mapWidthPx <= 0) return { lat: targetLat, lng: targetLng };
    const netPixelShift = (panelLeftPx - panelRightPx) / 2; 
    const currentMapBounds = map.getBounds(); if (!currentMapBounds) return { lat: targetLat, lng: targetLng };
    const lngSpan = currentMapBounds.toSpan().lng(); const degreesPerPixelLng = lngSpan / mapWidthPx;
    const adjustedLng = targetLng - (netPixelShift * degreesPerPixelLng); 
    return { lat: targetLat, lng: adjustedLng };
}
function getAdjustedBounds(originalBounds) { /* ... Full function ... */ 
    const dom = AppState.dom;
    if (!map?.getDiv || !originalBounds || !map.getProjection || typeof map.getZoom !== 'function') return originalBounds;
    const mapWidth = map.getDiv().offsetWidth; let panelLeftOffset = 0; let panelRightOffset = 0;
    if (dom.detailsOverlaySocialElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlaySocialElement).display !== "none") panelLeftOffset = dom.detailsOverlaySocialElement.offsetWidth;
    if (dom.detailsOverlayShopElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlayShopElement).display !== "none") panelRightOffset = dom.detailsOverlayShopElement.offsetWidth;
    else if (dom.listingsPanelElement && getComputedStyle(dom.listingsPanelElement).display !== "none" && window.innerWidth >= 768) panelRightOffset = dom.listingsPanelElement.offsetWidth;
    if ((panelLeftOffset <= 0 && panelRightOffset <= 0) || mapWidth <= 0) return originalBounds;
    const projection = map.getProjection(); const zoom = map.getZoom(); if (!projection || typeof zoom === "undefined") return originalBounds;
    const sw = originalBounds.getSouthWest(); const ne = originalBounds.getNorthEast(); if (!sw || !ne) return originalBounds;
    const swPoint = projection.fromLatLngToPoint(sw); const nePoint = projection.fromLatLngToPoint(ne); if (!swPoint || !nePoint) return originalBounds;
    const worldUnitsPerPixel = Math.pow(2, -zoom); const pixelShiftForBounds = (panelRightOffset - panelLeftOffset) / 2; 
    const worldOffsetX = pixelShiftForBounds * worldUnitsPerPixel;
    const newSwPoint = new google.maps.Point(swPoint.x + worldOffsetX, swPoint.y);
    const newNePoint = new google.maps.Point(nePoint.x + worldOffsetX, nePoint.y);
    const newSw = projection.fromPointToLatLng(newSwPoint); const newNe = projection.fromPointToLatLng(newNePoint);
    if (newSw && newNe) return new google.maps.LatLngBounds(newSw, newNe);
    return originalBounds;
}