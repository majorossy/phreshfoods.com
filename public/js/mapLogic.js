'use strict';

const DEBUG_MAP_LOGIC = true;

function mapDebugLog(...args) { if (DEBUG_MAP_LOGIC) console.log('[MapLogic-DEBUG]', ...args); }
function mapDebugWarn(...args) { if (DEBUG_MAP_LOGIC) console.warn('[MapLogic-WARN]', ...args); }
function mapDebugError(...args) { if (DEBUG_MAP_LOGIC) console.error('[MapLogic-ERROR]', ...args); }

var map;
var geocoder;
var infowindow;
var directionsRenderer;

let MAINE_BOUNDS_LITERAL;
// This top-level check for MAINE_BOUNDS_LITERAL will run when the script is parsed.
// If config.js (using defer) hasn't run yet, this will use the fallback.
// The value will be the one available when this script is first encountered by the browser.
if (typeof window.MAINE_BOUNDS_LITERAL !== 'undefined') {
    MAINE_BOUNDS_LITERAL = window.MAINE_BOUNDS_LITERAL;
    mapDebugLog("mapLogic.js: MAINE_BOUNDS_LITERAL loaded from global window object at script parse time.");
} else {
    MAINE_BOUNDS_LITERAL = { // Fallback
        sw: { lat: 42.975426, lng: -71.089859 },
        ne: { lat: 47.459683, lng: -66.949829 },
    };
    mapDebugWarn("mapLogic.js: MAINE_BOUNDS_LITERAL was not found globally at script parse time, using local default.");
}


// --- State for coordinating initialization ---
let mapApiLoadedAndCallbackFired = false;
// AppState.domReadyAndPopulated will be set by main.js

// This function contains the actual map setup logic
async function performMapSetup() {
    mapDebugLog("performMapSetup: Attempting actual map setup.");
    if (!window.AppState || !AppState.domReadyAndPopulated || !AppState.dom.mapElement) {
        mapDebugWarn("performMapSetup: Conditions not fully met or mapElement not ready. AppState.domReadyAndPopulated:", AppState.domReadyAndPopulated, "AppState.dom.mapElement:", AppState.dom.mapElement);
        // If domReadyAndPopulated is true but mapElement is still null, there's an issue in main.js DOM population.
        return; // Don't proceed if DOM elements aren't ready
    }

    mapDebugLog("performMapSetup: AppState.dom.mapElement IS ready.");
    const dom = AppState.dom;

    // Re-check MAINE_BOUNDS_LITERAL here to get the latest value if config.js ran after initial parse
    if (typeof window.MAINE_BOUNDS_LITERAL !== 'undefined') {
        MAINE_BOUNDS_LITERAL = window.MAINE_BOUNDS_LITERAL;
    } else {
        mapDebugWarn("performMapSetup: MAINE_BOUNDS_LITERAL still not global. Autocomplete might use fallback bounds.");
    }


    const activeMapStyles = (typeof USE_CUSTOM_MAP_STYLE !== 'undefined' && USE_CUSTOM_MAP_STYLE && typeof mapStyles !== 'undefined') ? mapStyles.maineLicensePlate : null;
    const defaultCenter = (typeof DEFAULT_MAP_CENTER !== 'undefined') ? DEFAULT_MAP_CENTER : { lat: 43.6926, lng: -70.2537 };
    const defaultZoom = (typeof DEFAULT_MAP_ZOOM !== 'undefined') ? DEFAULT_MAP_ZOOM : 10;


    try {
        map = new google.maps.Map(dom.mapElement, {
            center: defaultCenter,
            zoom: defaultZoom,
            mapTypeControl: false,
            styles: activeMapStyles,
            gestureHandling: "greedy",
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            rotateControl: false,
            scaleControl: true,
            mapId: '6c1bbba6c5f48ca2beb388ad' // Your Map ID
        });
        mapDebugLog("performMapSetup: Google Map object CREATED successfully.");
    } catch (error) {
        mapDebugError("performMapSetup: CRITICAL ERROR creating Google Map object.", error);
        if(dom.mapElement) dom.mapElement.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Could not initialize the map. Please try refreshing the page.</p>";
        return; // Stop further execution if map fails
    }

    window.geocoder = new google.maps.Geocoder();
    mapDebugLog("performMapSetup: google.maps.Geocoder CREATED.");

    infowindow = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0, -15),
        disableAutoPan: false
    });
    mapDebugLog("performMapSetup: google.maps.InfoWindow CREATED.");

    google.maps.event.addListener(infowindow, 'domready', () => {
        let iwOuterContainer = null;
        const contentNode = infowindow.getContent();
        if (contentNode && typeof contentNode !== 'string' && contentNode.parentElement) {
            let currentElement = contentNode;
            for (let i = 0; i < 5; i++) {
                if (currentElement.classList && (currentElement.classList.contains('gm-style-iw') || currentElement.classList.contains('gm-style-iw-box'))) {
                    iwOuterContainer = currentElement; break;
                }
                if (!currentElement.parentElement) break;
                currentElement = currentElement.parentElement;
            }
        }
        if (!iwOuterContainer) iwOuterContainer = document.querySelector('.gm-style-iw-box') || document.querySelector('.gm-style-iw');
        const baseElement = iwOuterContainer || document;
        const tailAndCloseContainer = baseElement.querySelector('.gm-style-iw-chr');
        if (tailAndCloseContainer) tailAndCloseContainer.style.display = 'none';
        const closeButton = baseElement.querySelector('button.gm-ui-hover-effect');
        if (closeButton) closeButton.style.display = 'none';
        const contentWrapper = baseElement.querySelector('.gm-style-iw-d');
        if (contentWrapper) contentWrapper.style.overflow = 'hidden';
    });

    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: { strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 6 },
    });
    if (dom.directionsPanel) directionsRenderer.setPanel(dom.directionsPanel);

    const mainSearchAutocompleteElement = dom.searchAutocompleteElement;
    if (mainSearchAutocompleteElement) {
        mapDebugLog("performMapSetup: Setting up 'gmp-placechange' listener for main search.");
        if (typeof MAINE_BOUNDS_LITERAL !== 'undefined') {
            const biasRect = `rectangle:${MAINE_BOUNDS_LITERAL.sw.lat},${MAINE_BOUNDS_LITERAL.sw.lng},${MAINE_BOUNDS_LITERAL.ne.lat},${MAINE_BOUNDS_LITERAL.ne.lng}`;
            if (!mainSearchAutocompleteElement.getAttribute('location-bias')) mainSearchAutocompleteElement.locationBias = biasRect;
            if (!mainSearchAutocompleteElement.getAttribute('location-restriction')) mainSearchAutocompleteElement.locationRestriction = biasRect;
        }
        if (!mainSearchAutocompleteElement.getAttribute('country')) mainSearchAutocompleteElement.country = "us";
        if (!mainSearchAutocompleteElement.getAttribute('place-fields')) mainSearchAutocompleteElement.placeFields = "name,formatted_address,geometry,address_components,place_id,types";

        mainSearchAutocompleteElement.addEventListener('gmp-placechange', () => {
            mapDebugLog("Main Autocomplete 'gmp-placechange' event triggered.");
            const place = mainSearchAutocompleteElement.place;
            if (!place?.geometry?.location) {
                mapDebugWarn("Main Autocomplete 'gmp-placechange': Invalid place. Input:", mainSearchAutocompleteElement.value);
                AppState.lastPlaceSelectedByAutocomplete = null;
                if (typeof handleSearch === "function") handleSearch();
                return;
            }
            AppState.lastPlaceSelectedByAutocomplete = place;
            const targetLocationLiteral = place.geometry.location;
            const targetLocationLatLng = new google.maps.LatLng(targetLocationLiteral.lat, targetLocationLiteral.lng);
            map.panTo(getAdjustedMapCenter(targetLocationLatLng));
            if (place.geometry.viewport) {
                 const viewport = new google.maps.LatLngBounds(place.geometry.viewport.southwest, place.geometry.viewport.northeast);
                map.fitBounds(getAdjustedBounds(viewport));
            } else {
                map.setZoom(defaultZoom);
            }
            if (typeof handleSearch === "function") handleSearch();
        });
    } else {
        mapDebugWarn("performMapSetup: AppState.dom.searchAutocompleteElement NOT FOUND.");
    }

    map.addListener("click", (e) => {
        if (e.target instanceof google.maps.marker.AdvancedMarkerElement) return;
        if (e.placeId) e.stop();
        if (AppState.markerClickedRecently) return;
        if (infowindow) infowindow.close();
        if (AppState.dom.detailsOverlayShopElement?.classList.contains("is-open") ||
            AppState.dom.detailsOverlaySocialElement?.classList.contains("is-open")) {
            if (typeof closeClickedShopOverlaysAndNavigateHome === "function") closeClickedShopOverlaysAndNavigateHome();
        }
    });

    map.addListener("idle", () => {
        const currentMapCenter = map.getCenter();
        if (currentMapCenter && AppState.currentlyDisplayedShops?.length > 0 && typeof renderListings === "function") {
            if (!AppState.lastPlaceSelectedByAutocomplete?.geometry) {
                renderListings(AppState.currentlyDisplayedShops, true, currentMapCenter);
            }
        }
    });

    map.panTo(getAdjustedMapCenter(defaultCenter));

    if (typeof processAndPlotShops === "function") {
        mapDebugLog("performMapSetup: Calling processAndPlotShops().");
        processAndPlotShops(); // This should be async if it awaits, but performMapSetup itself is called without await from initAppMap
    } else {
        mapDebugError("performMapSetup: CRITICAL - processAndPlotShops function NOT FOUND.");
    }
    mapDebugLog("performMapSetup: Map setup sequence COMPLETE.");
}

// Function called by Google Maps API callback=initAppMap
async function initAppMap() {
    mapDebugLog("initAppMap (API Callback): Google Maps API script loaded and callback fired.");
    mapApiLoadedAndCallbackFired = true;

    // Ensure AdvancedMarkerElement library is available
    if (typeof google.maps.marker?.AdvancedMarkerElement === 'undefined') {
        try {
            await google.maps.importLibrary("marker");
            mapDebugLog("initAppMap (API Callback): Dynamically imported 'marker' library for AdvancedMarkerElement.");
        } catch (e) {
            mapDebugError("initAppMap (API Callback): FAILED to import 'marker' library.", e);
            // Consider how to handle this error - map might not function fully
        }
    }
    attemptMapInitialization();
}

// This function is the gatekeeper for actual map setup.
// It can be called by initAppMap (API callback) or by main.js (DOMContentLoaded).
// It only proceeds if all conditions are met.
function attemptMapInitialization() {
    mapDebugLog("attemptMapInitialization called. API Loaded:", mapApiLoadedAndCallbackFired, "DOM Ready:", AppState.domReadyAndPopulated);
    if (mapApiLoadedAndCallbackFired && AppState.domReadyAndPopulated) {
        if (map) { // Check if map is already initialized (to prevent double init)
            mapDebugLog("attemptMapInitialization: Map already initialized. Skipping.");
            return;
        }
        mapDebugLog("attemptMapInitialization: All conditions met. Proceeding to performMapSetup.");
        performMapSetup(); // This is where the actual map setup happens
    } else {
        mapDebugLog("attemptMapInitialization: Conditions not yet met. Will wait for other trigger.");
    }
}


// --- Remaining functions (calculateAndDisplayRoute, plotMarkers, etc.) ---
// (No changes made to these in this iteration, assuming they are correct from previous versions)
async function calculateAndDisplayRoute(destinationShopData) {
    mapDebugLog("calculateAndDisplayRoute: CALLED. DestinationShopData:", destinationShopData);
    const dom = AppState.dom;

    if (!directionsRenderer) { mapDebugError("calculateAndDisplayRoute: Directions Renderer not initialized."); alert("Directions service is unavailable."); return; }
    if (!destinationShopData) { mapDebugError("calculateAndDisplayRoute: No destination data provided."); alert("Destination needed for directions."); return; }

    directionsRenderer.setDirections({ routes: [] });
    if (dom.directionsPanel) { dom.directionsPanel.innerHTML = ""; }

    let origin;
    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) {
        const loc = AppState.lastPlaceSelectedByAutocomplete.geometry.location;
        if (typeof loc.lat === 'number' && typeof loc.lng === 'number') { // LatLngLiteral
             origin = `${loc.lat},${loc.lng}`;
        } else if (typeof loc.lat === 'function' && typeof loc.lng === 'function'){ // LatLng object
             origin = `${loc.lat()},${loc.lng()}`;
        }
        mapDebugLog("calculateAndDisplayRoute: Origin from Autocomplete:", origin);
    } else if (dom.searchAutocompleteElement?.value.trim()) {
        origin = dom.searchAutocompleteElement.value.trim();
        mapDebugLog("calculateAndDisplayRoute: Origin from search input:", origin);
    } else {
        const fallbackOrigin = prompt("Please enter your starting address for directions:", `${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.lng}`);
        if (!fallbackOrigin) { alert("Starting location needed."); return; }
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
        alert(`Cannot get directions to "${typeof escapeHTML === 'function' ? escapeHTML(destinationShopData.Name || "shop") : (destinationShopData.Name || "shop")}" due to missing location.`);
        return;
    }

    try {
        const directionsResult = await getDirectionsClient(origin, destinationApiArg);
        if (directionsResult && directionsResult.status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(directionsResult);
            if(dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.add('hidden');
            if(dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.remove('hidden');
            if (directionsResult.routes?.[0]?.legs?.[0]?.start_location && map) {
                 const startLoc = directionsResult.routes[0].legs[0].start_location;
                 map.panTo(getAdjustedMapCenter(new google.maps.LatLng(startLoc.lat, startLoc.lng)));
            }
        } else {
            window.alert("Directions request failed: " + (directionsResult ? directionsResult.status : "Unknown error."));
        }
    } catch (error) {
        window.alert("Error calculating directions: " + error.message);
    }
}

function clearDirections() {
    mapDebugLog("clearDirections: CALLED.");
    const dom = AppState.dom;
    if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
    if (dom.directionsPanel) dom.directionsPanel.innerHTML = "";
    if(dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.remove('hidden');
    if(dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.add('hidden');
}

function plotMarkers(shopsToPlot) {
    mapDebugLog("plotMarkers: CALLED. shopsToPlot count:", shopsToPlot?.length ?? 'N/A');
    let clearedCount = 0;
    (AppState.allFarmStands || []).forEach(s => {
        if (s.marker) { s.marker.map = null; s.marker = null; clearedCount++; }
    });
    mapDebugLog("plotMarkers: Old markers cleared:", clearedCount);

    if (!shopsToPlot || shopsToPlot.length === 0) { mapDebugLog("plotMarkers: No shops to plot."); return; }
    shopsToPlot.forEach((shop) => {
        if (shop.lat != null && shop.lng != null) createMarkerForShop(shop);
        else mapDebugWarn(`plotMarkers: SKIPPING marker for ${shop.Name} due to missing lat/lng.`);
    });
}

async function createMarkerForShop(shop) {
    mapDebugLog(`createMarkerForShop: CALLED for shop: ${shop.Name}.`);
    const lat = parseFloat(shop.lat);
    const lng = parseFloat(shop.lng);
    if (isNaN(lat) || isNaN(lng)) { mapDebugWarn(`createMarkerForShop: Invalid lat/lng for ${shop.Name}.`); return; }
    if (!map) { mapDebugError("createMarkerForShop: 'map' object NOT defined."); return; }
    if (!google.maps.marker?.AdvancedMarkerElement) {
        try { await google.maps.importLibrary("marker"); } catch (e) { mapDebugError("createMarkerForShop: FAILED to import 'marker' library.", e); return; }
    }
    const markerElement = document.createElement('div');
    markerElement.style.width = '16px'; markerElement.style.height = '16px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.backgroundColor = typeof markerColor !== 'undefined' ? markerColor : '#FF0000'; // Use config or fallback
    markerElement.style.border = '1.5px solid #ffffff'; markerElement.style.opacity = '0.9';

    try {
        const newMarker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat, lng }, map: map, title: shop.Name, content: markerElement, zIndex: 1
        });
        shop.marker = newMarker;
    } catch (error) { mapDebugError(`createMarkerForShop: ERROR creating AdvancedMarkerElement for ${shop.Name}:`, error); return; }

    if (!shop.marker) { mapDebugError(`createMarkerForShop: Marker object still null for ${shop.Name}.`); return; }

    // Corrected event listener for AdvancedMarkerElement
    shop.marker.addListener("gmp-click", (event) => {
        mapDebugLog(`AdvancedMarkerElement 'gmp-click' for shop: ${shop.Name}.`, "Event:", event);
        AppState.markerClickedRecently = true;
        if (shop.marker) shop.marker.zIndex = 1000;
        if (shop.slug && typeof navigateToStoreBySlug === 'function') {
            navigateToStoreBySlug(shop);
        } else {
            mapDebugWarn(`Marker click fallback for ${shop.Name}.`);
            if (typeof openClickedShopOverlays === 'function') openClickedShopOverlays(shop);
            setTimeout(() => showInfoWindowForShop(shop), 100); // showInfoWindowForShop needs to be async if it awaits
        }
        setTimeout(() => { AppState.markerClickedRecently = false; }, 300);
    });
    mapDebugLog(`createMarkerForShop: 'gmp-click' listener ADDED for ${shop.Name}.`);
}

async function showInfoWindowForShop(shop) {
    mapDebugLog(`showInfoWindowForShop: CALLED for shop: ${shop ? shop.Name : 'NULL shop'}.`);
    if (!shop) { mapDebugError("showInfoWindowForShop: No shop."); return; }
    const position = shop.marker?.position || (shop.lat != null && shop.lng != null ? { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng) } : null);
    if (!position) { if (infowindow) infowindow.close(); return; }
    if (!map || !infowindow) { mapDebugError("showInfoWindowForShop: Map or Infowindow undefined."); return; }
    infowindow.close();
    (AppState.allFarmStands || []).forEach(s => { if (s.marker && s !== shop && typeof s.marker.zIndex === 'number') s.marker.zIndex = 1; });
    if (shop.marker && typeof shop.marker.zIndex === 'number') shop.marker.zIndex = 1000;

    let needsMoreDetails = false;
    const fieldsToFetchForInfoWindow = [];
    if (!shop.placeDetails?.reviews) { fieldsToFetchForInfoWindow.push('reviews'); needsMoreDetails = true; }
    if (!shop.placeDetails?.url) { fieldsToFetchForInfoWindow.push('url'); needsMoreDetails = true; }

    if (shop.GoogleProfileID && needsMoreDetails && fieldsToFetchForInfoWindow.length > 0) {
        const newDetails = await getPlaceDetailsClient(shop.GoogleProfileID, fieldsToFetchForInfoWindow.join(','));
        if (newDetails) shop.placeDetails = { ...(shop.placeDetails || {}), ...newDetails };
    }

    if (typeof generateShopContentHTML === 'function') {
        let content = generateShopContentHTML(shop, 'infowindow');
        if (content?.trim()) {
            infowindow.setContent(content);
            infowindow.open({ anchor: shop.marker, map: map, shouldFocus: false });
        } else { mapDebugWarn(`showInfoWindowForShop: Empty content for ${shop.Name}.`); }
    } else { mapDebugError("showInfoWindowForShop: generateShopContentHTML not found."); }
}

function getAdjustedMapCenter(targetCenterInput) {
    mapDebugLog("getAdjustedMapCenter: CALLED.");
    const dom = AppState.dom;
    if (!map?.getDiv || !map.getBounds() || !map.getProjection()) return targetCenterInput;
    let targetLat, targetLng;
    if (targetCenterInput?.lat && typeof targetCenterInput.lat === 'function') { targetLat = targetCenterInput.lat(); targetLng = targetCenterInput.lng(); }
    else if (targetCenterInput?.lat && typeof targetCenterInput.lat === 'number') { targetLat = targetCenterInput.lat; targetLng = targetCenterInput.lng; }
    else { const mc = map.getCenter(); return mc ? { lat: mc.lat(), lng: mc.lng() } : (typeof DEFAULT_MAP_CENTER !== 'undefined' ? DEFAULT_MAP_CENTER : { lat: 0, lng: 0}); }
    const mapWidthPx = map.getDiv().offsetWidth; let panelLeftPx = 0; let panelRightPx = 0;
    const socialPanel = dom.detailsOverlaySocialElement; if (socialPanel?.offsetParent && socialPanel.offsetWidth > 0) panelLeftPx = socialPanel.offsetWidth;
    const shopPanel = dom.detailsOverlayShopElement;
    if (shopPanel?.offsetParent && shopPanel.offsetWidth > 0) panelRightPx = shopPanel.offsetWidth;
    else { const lp = dom.listingsPanelElement; if (lp && getComputedStyle(lp).display !== "none" && lp.offsetWidth > 0 && window.innerWidth >= 768) panelRightPx = lp.offsetWidth; }
    if ((panelLeftPx <= 0 && panelRightPx <= 0) || mapWidthPx <= 0) return { lat: targetLat, lng: targetLng };
    const netPixelShift = (panelLeftPx - panelRightPx) / 2;
    const currentMapBounds = map.getBounds(); if (!currentMapBounds) return { lat: targetLat, lng: targetLng };
    const lngSpan = currentMapBounds.toSpan().lng(); const degreesPerPixelLng = lngSpan / mapWidthPx;
    const adjustedLng = targetLng - (netPixelShift * degreesPerPixelLng);
    return { lat: targetLat, lng: adjustedLng };
}

function getAdjustedBounds(originalBounds) {
    mapDebugLog("getAdjustedBounds: CALLED.");
    const dom = AppState.dom;
    if (!map?.getDiv || !originalBounds || !map.getProjection || typeof map.getZoom !== 'function') return originalBounds;
    const mapWidth = map.getDiv().offsetWidth; let panelLeftOffset = 0; let panelRightOffset = 0;
    if (dom.detailsOverlaySocialElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlaySocialElement).display !== "none") panelLeftOffset = dom.detailsOverlaySocialElement.offsetWidth;
    if (dom.detailsOverlayShopElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlayShopElement).display !== "none") panelRightOffset = dom.detailsOverlayShopElement.offsetWidth;
    else if (dom.listingsPanelElement && getComputedStyle(dom.listingsPanelElement).display !== "none" && dom.listingsPanelElement.offsetWidth > 0 && window.innerWidth >= 768) panelRightOffset = dom.listingsPanelElement.offsetWidth;
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