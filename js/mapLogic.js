'use strict';

// Google Maps API objects, defined globally within this module, initialized in initAppMap
var map; // 'var' for broader function scope for callback from Google Maps API script
var geocoder; // Assigned to window.geocoder in initAppMap
var placesService;
var infowindow;
var directionsService;
var directionsRenderer;
var autocomplete; // For Google Places Autocomplete

const MAINE_BOUNDS_LITERAL = { // Specific to mapLogic, can stay here
  sw: { lat: 42.975426, lng: -71.089859 },
  ne: { lat: 47.459683, lng: -66.949829 },
};

// This function is the callback for the Google Maps API script
// It MUST be globally accessible, hence 'window.initAppMap' or just 'initAppMap' if not in a module
function initAppMap() {
    console.log("mapLogic.js: initAppMap callback fired.");

    // Check if AppState.dom and specifically mapElement is ready.
    // This can happen if main.js's DOMContentLoaded hasn't run yet.
    if (!window.AppState || !window.AppState.dom || !AppState.dom.mapElement) {
        console.warn("mapLogic.js: AppState.dom.mapElement not ready. Deferring map initialization slightly...");
        setTimeout(initAppMap, 50); // Retry in 50ms
        return;
    }

    console.log("mapLogic.js: AppState.dom.mapElement IS ready. Proceeding with map initialization.");
    const dom = AppState.dom;

    const activeMapStyles = USE_CUSTOM_MAP_STYLE ? mapStyles.maineLicensePlate : null;

    map = new google.maps.Map(dom.mapElement, {
        center: DEFAULT_MAP_CENTER,       // From config.js
        zoom: DEFAULT_MAP_ZOOM,         // From config.js
        mapTypeControl: false,
        styles: activeMapStyles,        // <--- USE THE CONDITIONAL STYLE HERE
        gestureHandling: "greedy",
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        rotateControl: false,
        scaleControl: true,
    });
    window.geocoder = new google.maps.Geocoder(); // Make globally available if needed, e.g. by main.js
    placesService = new google.maps.places.PlacesService(map);
    infowindow = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0, -15),
        disableAutoPan: false // Let InfoWindow pan by default unless it causes issues
    });

    // Custom styling/hiding for InfoWindow parts
    google.maps.event.addListener(infowindow, 'domready', () => {
        const iwContainer = infowindow.div; // Get the InfoWindow's main div
        if (!iwContainer) return;
        const tailAndCloseContainer = iwContainer.querySelector('.gm-style-iw-chr'); // Tail container
        if (tailAndCloseContainer) tailAndCloseContainer.style.display = 'none';
        const closeButton = iwContainer.querySelector('button.gm-ui-hover-effect'); // Default close 'X' button
        if (closeButton) closeButton.style.display = 'none';
        // Override padding directly on the content wrapper injected by Google (if needed beyond CSS)
        const contentWrapper = iwContainer.querySelector('.gm-style-iw-d');
        if(contentWrapper) { contentWrapper.style.overflow = 'hidden'; /* Already in CSS, but reinforces */ }
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: { strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 6 },
    });

    if (dom.directionsPanel) {
        directionsRenderer.setPanel(dom.directionsPanel);
    } else {
        console.warn("mapLogic.js: Directions panel div not found in AppState.dom.");
    }

    // Autocomplete Setup
    if (dom.searchInput) {
        const maineAutocompleteBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(MAINE_BOUNDS_LITERAL.sw.lat, MAINE_BOUNDS_LITERAL.sw.lng),
            new google.maps.LatLng(MAINE_BOUNDS_LITERAL.ne.lat, MAINE_BOUNDS_LITERAL.ne.lng)
        );
        autocomplete = new google.maps.places.Autocomplete(dom.searchInput, {
            bounds: maineAutocompleteBounds,
            strictBounds: true,
            componentRestrictions: { country: "us" },
            fields: ["name", "formatted_address", "geometry", "address_components", "place_id", "types"],
        });

// js/mapLogic.js
// Inside initAppMap function, within autocomplete.addListener('place_changed', ...):

        autocomplete.addListener("place_changed", () => {
            AppState.lastPlaceSelectedByAutocomplete = null;
            const place = autocomplete.getPlace();

            if (!place?.geometry?.location) {
                console.warn("Autocomplete: Place invalid or no geometry.", AppState.dom.searchInput.value);
                if (place?.name) AppState.dom.searchInput.value = place.name;
                else if (place?.formatted_address) AppState.dom.searchInput.value = place.formatted_address;
                if (typeof handleSearch === "function") handleSearch();
                return;
            }

            // Format display address (your existing logic here)
            let displayAddress = place.formatted_address || place.name || AppState.dom.searchInput.value;
            if (place.formatted_address) {
                const countryString = ", USA";
                if (displayAddress.endsWith(countryString)) {
                    displayAddress = displayAddress.substring(0, displayAddress.length - countryString.length);
                }
                displayAddress = displayAddress.replace(/,\s*$/, "").trim();
            }
            AppState.dom.searchInput.value = displayAddress;


            AppState.lastPlaceSelectedByAutocomplete = place;
            const targetLocation = place.geometry.location;

            console.log("--- Autocomplete place_changed ---");
            console.log("Place Name:", place.name);
            console.log("Place Types:", place.types);

            map.setCenter(getAdjustedMapCenter(targetLocation));
            console.log("mapLogic: Center set for", place.name);

            // --- ALWAYS SET A PREDEFINED ZOOM ---
            // Option A: Use one default zoom for all selections
            console.log(`mapLogic: Setting zoom to DEFAULT_MAP_ZOOM (${DEFAULT_MAP_ZOOM}) for ${place.name}.`);
            map.setZoom(DEFAULT_MAP_ZOOM);

            // Option B: Differentiate slightly based on type, but still with setZoom
            // const placeTypes = place.types || [];
            // const isVerySpecific = placeTypes.includes("street_address") || placeTypes.includes("premise");
            // if (isVerySpecific) {
            //     console.log(`mapLogic: Setting zoom to SPECIFIC_ADDRESS_ZOOM (${SPECIFIC_ADDRESS_ZOOM}) for ${place.name}.`);
            //     map.setZoom(SPECIFIC_ADDRESS_ZOOM); // (Make sure SPECIFIC_ADDRESS_ZOOM is defined in config.js)
            // } else {
            //     console.log(`mapLogic: Setting zoom to DEFAULT_MAP_ZOOM (${DEFAULT_MAP_ZOOM}) for ${place.name}.`);
            //     map.setZoom(DEFAULT_MAP_ZOOM);
            // }
            // --- END ZOOM LOGIC ---


            google.maps.event.addListenerOnce(map, 'idle', () => {
                console.log("mapLogic: Zoom level AFTER programmatic zoom (idle):", map.getZoom());
            });

            if (typeof handleSearch === "function") handleSearch(); // from main.js
        });
    } else { console.warn("mapLogic.js: Search input not in AppState.dom for Autocomplete."); }

    // Map Listeners
    map.addListener("click", (e) => {
        if (e.placeId) e.stop();
        if (AppState.markerClickedRecently) return;
        if (infowindow) infowindow.close();
        if (dom.detailsOverlayShopElement?.classList.contains("is-open") || dom.detailsOverlaySocialElement?.classList.contains("is-open")) {
            if (typeof closeClickedShopOverlays === "function") closeClickedShopOverlays(); // From uiLogic.js
        }
    });

    map.addListener("idle", () => {
        const currentMapCenter = map.getCenter();
        if (currentMapCenter && AppState.currentlyDisplayedShops && typeof renderListings === "function") {
            if (!AppState.lastPlaceSelectedByAutocomplete?.geometry) {
                if (typeof renderListings === "function") renderListings(AppState.currentlyDisplayedShops, true, currentMapCenter); // from uiLogic.js
            }
        }
    });

    map.setCenter(getAdjustedMapCenter(DEFAULT_MAP_CENTER)); // Initial map centering

    if (typeof processAndPlotShops === "function") { // From main.js
        processAndPlotShops(); // This fetches data and then calls handleSearch initially
    } else {
        console.error("mapLogic.js: processAndPlotShops function not found (expected in main.js).");
    }
} // End of initAppMap

function calculateAndDisplayRoute(destination) {
    const dom = AppState.dom;
    if (!directionsService || !directionsRenderer) { console.error("Directions Svc not init."); alert("Directions service unavailable."); return; }
    if (!destination) { console.error("Directions: No destination."); alert("Destination needed for directions."); return; }
    directionsRenderer.setDirections({ routes: [] });
    if (dom.directionsPanel) dom.directionsPanel.innerHTML = "";

    let origin;
    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) origin = AppState.lastPlaceSelectedByAutocomplete.geometry.location;
    else if (dom.searchInput?.value.trim()) origin = dom.searchInput.value.trim();
    else { /* Prompt for origin, default to DEFAULT_MAP_CENTER */
        const fallback = prompt("Enter starting address:", `${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.lng}`);
        if (!fallback) { alert("Start location needed."); return; }
        origin = fallback;
    }

    let destArg;
    if (destination.lat && destination.lng) destArg = { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) };
    else if (destination.GoogleProfileID) destArg = { placeId: destination.GoogleProfileID };
    else if (destination.Address && destination.Address !== 'N/A') destArg = destination.Address;
    else { alert(`Cannot route to ${destination.Name || "shop"}.`); return; }

    directionsService.route({ origin, destination: destArg, travelMode: google.maps.TravelMode.DRIVING },
        (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(response);
                if(dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.add('hidden');
                if(dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.remove('hidden');
                if (response.routes?.[0]?.legs?.[0]?.start_location) {
                    map.panTo(getAdjustedMapCenter(response.routes[0].legs[0].start_location));
                    // Optional: map.fitBounds(getAdjustedBounds(response.routes[0].bounds));
                }
            } else { window.alert("Directions request failed: " + status); console.error("Directions fail:", status, response); }
        }
    );
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
    (AppState.allFarmStands || []).forEach(s => { if (s.marker) s.marker.setMap(null); }); // Clear previous
    shopsToPlot.forEach(shop => { if (shop.lat != null && shop.lng != null) createMarkerForShop(shop); });
}

function createMarkerForShop(shop) {
    const lat = parseFloat(shop.lat); const lng = parseFloat(shop.lng);
    if (isNaN(lat) || isNaN(lng)) { console.warn(`Marker: Invalid lat/lng for ${shop.Name}`); return; }

    const iconConfig = { path: google.maps.SymbolPath.CIRCLE, fillColor: markerColor, fillOpacity: 0.9, strokeColor: "#ffffff", strokeWeight: 1.5, scale: 8, };
    shop.marker = new google.maps.Marker({ position: { lat, lng }, map, title: shop.Name, icon: iconConfig, zIndex: 1 });

    shop.marker.addListener("click", () => {
        AppState.markerClickedRecently = true;
        if (shop.marker) shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1); // Bring to front

        // Call UI logic to handle opening overlays
        if (typeof openClickedShopOverlays === "function") openClickedShopOverlays(shop); // From uiLogic.js
        else console.warn("mapLogic: openClickedShopOverlays function not defined (expected in uiLogic.js).");

        // Show infowindow specific to this marker
        setTimeout(() => { showInfoWindowForShop(shop); }, 50); // Defined in this file

        setTimeout(() => { AppState.markerClickedRecently = false; }, 300);
    });
}

function showInfoWindowForShop(shop) {
    if (!shop) { console.error("showInfoWindowForShop: No shop provided."); return; }
    const position = shop.marker?.getPosition() || (shop.lat != null && shop.lng != null ? { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng) } : null);
    if (!position) { if (infowindow) infowindow.close(); return; }

    if (map) map.panTo(getAdjustedMapCenter(position)); // Ensure adjusted centering
    if (!infowindow) infowindow = new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -15) });
    infowindow.close(); // Close any existing one first

    // Highlight logic
    (AppState.allFarmStands || []).forEach(s => { if (s.marker && s !== shop) s.marker.setZIndex(1); });
    if (shop.marker) shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);

    if (shop.GoogleProfileID && placesService) {
        placesService.getDetails(
            { placeId: shop.GoogleProfileID, fields: ['name', 'formatted_address', 'website', 'opening_hours', 'rating', 'user_ratings_total', 'photos', 'formatted_phone_number', 'url', 'icon', 'business_status', 'reviews', 'geometry'] },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) shop.placeDetails = place;
                else console.warn(`mapLogic: InfoWindow Places API failed for ${shop.Name}: ${status}. Using cached/CSV data.`);
                if (typeof generateShopContentHTML === 'function') { // From uiLogic.js
                    const content = generateShopContentHTML(shop, 'infowindow');
                    infowindow.setContent(content);
                    infowindow.open({ anchor: shop.marker, map, shouldFocus: false });
                } else { console.error("mapLogic: generateShopContentHTML not found (uiLogic.js).");}
            }
        );
    } else {
        if (typeof generateShopContentHTML === 'function') {
            const content = generateShopContentHTML(shop, 'infowindow'); // From uiLogic.js
            infowindow.setContent(content);
            infowindow.open({ anchor: shop.marker, map, shouldFocus: false });
        } else { console.error("mapLogic: generateShopContentHTML not found (uiLogic.js).");}
    }
}

function getAdjustedMapCenter(targetCenterInput) {
    const dom = AppState.dom;
    if (!map?.getDiv || !map.getBounds() || !map.getProjection()) return targetCenterInput;
    let targetLat, targetLng;
    if (targetCenterInput?.lat && typeof targetCenterInput.lat === 'function') { targetLat = targetCenterInput.lat(); targetLng = targetCenterInput.lng(); }
    else if (targetCenterInput?.lat && typeof targetCenterInput.lat === 'number') { targetLat = targetCenterInput.lat; targetLng = targetCenterInput.lng; }
    else { const c = map.getCenter(); if (!c) return DEFAULT_MAP_CENTER; return { lat: c.lat(), lng: c.lng() }; }

    const mapDiv = map.getDiv(); const mapWidthPx = mapDiv.offsetWidth;
    let panelLeftPx = 0, panelRightPx = 0;

    if (dom.detailsOverlaySocialElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlaySocialElement).display !== "none") panelLeftPx = dom.detailsOverlaySocialElement.offsetWidth;
    if (dom.detailsOverlayShopElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlayShopElement).display !== "none") panelRightPx = dom.detailsOverlayShopElement.offsetWidth;
    else if (dom.listingsPanelElement && getComputedStyle(dom.listingsPanelElement).display !== "none" && dom.listingsPanelElement.offsetWidth > 0 && window.innerWidth >= 768) panelRightPx = dom.listingsPanelElement.offsetWidth;

    if ((panelLeftPx <= 0 && panelRightPx <= 0) || mapWidthPx <= 0) return { lat: targetLat, lng: targetLng };
    const netPixelShift = (panelLeftPx - panelRightPx) / 2;
    const bounds = map.getBounds(); if (!bounds) return { lat: targetLat, lng: targetLng };
    const lngSpan = bounds.toSpan().lng(); const degPerPixelLng = lngSpan / mapWidthPx;
    return { lat: targetLat, lng: targetLng - (netPixelShift * degPerPixelLng) };
}

function getAdjustedBounds(originalBounds) {
    const dom = AppState.dom;
    if (!map?.getDiv || !originalBounds || !map.getProjection || typeof map.getZoom !== 'function') return originalBounds;
    const mapDiv = map.getDiv(); const mapWidth = mapDiv.offsetWidth;
    let panelLeft = 0, panelRight = 0;

    if (dom.detailsOverlaySocialElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlaySocialElement).display !== "none") panelLeft = dom.detailsOverlaySocialElement.offsetWidth;
    if (dom.detailsOverlayShopElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlayShopElement).display !== "none") panelRight = dom.detailsOverlayShopElement.offsetWidth;
    else if (dom.listingsPanelElement && getComputedStyle(dom.listingsPanelElement).display !== "none" && dom.listingsPanelElement.offsetWidth > 0 && window.innerWidth >= 768) panelRight = dom.listingsPanelElement.offsetWidth;

    if ((panelLeft <= 0 && panelRight <= 0) || mapWidth <= 0) return originalBounds;
    const projection = map.getProjection(); const zoom = map.getZoom();
    if (!projection || typeof zoom === "undefined") return originalBounds;

    const sw = originalBounds.getSouthWest(); const ne = originalBounds.getNorthEast();
    if (!sw || !ne) { console.warn("AdjustBounds: Invalid SW/NE from originalBounds."); return originalBounds; }
    const swPoint = projection.fromLatLngToPoint(sw); const nePoint = projection.fromLatLngToPoint(ne);
    if (!swPoint || !nePoint) { console.warn("AdjustBounds: Invalid points from projection."); return originalBounds; }

    const worldUnitsPerPixel = Math.pow(2, -zoom); // Simplified relation for a single zoom level
    const pixelOffsetX = (panelRight - panelLeft) / 2;
    const worldOffsetX = pixelOffsetX * worldUnitsPerPixel; // This might need adjustment based on specific projection details at poles

    // A more robust way for longitude if crossing date line is an issue (not typical for Maine)
    // For simplicity, the previous method for lng offset via degreesPerPixel in getAdjustedMapCenter is often more stable.
    // Here we're directly manipulating projected 'x' world coordinates.
    // For latitude, a similar worldOffsetY could be calculated if vertical panels were present.

    const newSw = projection.fromPointToLatLng(new google.maps.Point(swPoint.x - worldOffsetX, swPoint.y));
    const newNe = projection.fromPointToLatLng(new google.maps.Point(nePoint.x - worldOffsetX, nePoint.y));

    if (newSw && newNe) return new google.maps.LatLngBounds(newSw, newNe);
    console.warn("AdjustBounds: Failed to create new LatLngBounds from adjusted points.");
    return originalBounds;
}