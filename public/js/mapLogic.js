'use strict';

// --- DEBUG FLAG ---
const DEBUG_MAP_LOGIC = true; // Set to true to enable detailed logging in this file

// Helper for conditional logging
function mapDebugLog(...args) {
    if (DEBUG_MAP_LOGIC) {
        console.log('[MapLogic-DEBUG]', ...args);
    }
}
function mapDebugWarn(...args) {
    if (DEBUG_MAP_LOGIC) {
        console.warn('[MapLogic-WARN]', ...args);
    }
}
function mapDebugError(...args) {
    if (DEBUG_MAP_LOGIC) {
        console.error('[MapLogic-ERROR]', ...args);
    }
}
// --- END DEBUG FLAG & HELPERS ---


// Google Maps API objects, defined globally within this module, initialized in initAppMap
var map; // 'var' for broader function scope for callback from Google Maps API script
var geocoder; // Google Maps Geocoder object
var placesService; // Google Maps PlacesService object
var infowindow;
var directionsRenderer; // This is used to RENDER directions on the map
var autocomplete; // For Google Places Autocomplete

let MAINE_BOUNDS_LITERAL;
if (typeof window.MAINE_BOUNDS_LITERAL !== 'undefined') {
    MAINE_BOUNDS_LITERAL = window.MAINE_BOUNDS_LITERAL;
    mapDebugLog("MAINE_BOUNDS_LITERAL loaded from global window object.");
} else {
    MAINE_BOUNDS_LITERAL = {
        sw: { lat: 42.975426, lng: -71.089859 },
        ne: { lat: 47.459683, lng: -66.949829 },
    };
    mapDebugWarn("MAINE_BOUNDS_LITERAL was not found globally (from config.js), using local default.");
}


function initAppMap() {
    mapDebugLog("initAppMap: Callback fired.");
    if (!window.AppState || !window.AppState.dom || !AppState.dom.mapElement) {
        mapDebugWarn("initAppMap: AppState.dom.mapElement not ready. Deferring map initialization slightly...");
        setTimeout(initAppMap, 150); // Slightly increased delay
        return;
    }

    mapDebugLog("initAppMap: AppState.dom.mapElement IS ready.");
    const dom = AppState.dom;
    mapDebugLog("initAppMap: AppState.dom captured:", dom);

    // Constants from config.js
    const activeMapStyles = USE_CUSTOM_MAP_STYLE ? mapStyles.maineLicensePlate : null;
    mapDebugLog("initAppMap: USE_CUSTOM_MAP_STYLE:", USE_CUSTOM_MAP_STYLE, "Active styles length (if custom):", activeMapStyles ? activeMapStyles.length : 'N/A (Google Default)');
    mapDebugLog("initAppMap: DEFAULT_MAP_CENTER:", DEFAULT_MAP_CENTER, "DEFAULT_MAP_ZOOM:", DEFAULT_MAP_ZOOM);

    try {
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
        mapDebugLog("initAppMap: Google Map object CREATED successfully.");
    } catch (error) {
        mapDebugError("initAppMap: CRITICAL ERROR creating Google Map object.", error);
        // Optionally, display a user-friendly message on the page
        if(dom.mapElement) dom.mapElement.innerHTML = "<p style='color:red; text-align:center; padding:20px;'>Could not initialize the map. Please try refreshing the page.</p>";
        return; // Stop further execution if map fails
    }


    window.geocoder = new google.maps.Geocoder();
    mapDebugLog("initAppMap: google.maps.Geocoder CREATED.");
    placesService = new google.maps.places.PlacesService(map);
    mapDebugLog("initAppMap: google.maps.places.PlacesService CREATED with map object.");

    infowindow = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0, -15),
        disableAutoPan: false
    });
    mapDebugLog("initAppMap: google.maps.InfoWindow CREATED.");

    google.maps.event.addListener(infowindow, 'domready', () => {
        mapDebugLog("InfoWindow 'domready' event triggered.");
        const iwContainer = infowindow.div;
        if (!iwContainer) { mapDebugWarn("InfoWindow 'domready': iwContainer not found."); return; }
        const tailAndCloseContainer = iwContainer.querySelector('.gm-style-iw-chr');
        if (tailAndCloseContainer) { tailAndCloseContainer.style.display = 'none'; mapDebugLog("InfoWindow 'domready': Tail & Chrome container hidden.");}
        const closeButton = iwContainer.querySelector('button.gm-ui-hover-effect');
        if (closeButton) { closeButton.style.display = 'none'; mapDebugLog("InfoWindow 'domready': Close button hidden.");}
        const contentWrapper = iwContainer.querySelector('.gm-style-iw-d');
        if(contentWrapper) { contentWrapper.style.overflow = 'hidden'; mapDebugLog("InfoWindow 'domready': Content wrapper overflow set to hidden.");}
    });

    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: { strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 6 },
    });
    mapDebugLog("initAppMap: google.maps.DirectionsRenderer CREATED.");

    if (dom.directionsPanel) {
        directionsRenderer.setPanel(dom.directionsPanel);
        mapDebugLog("initAppMap: DirectionsRenderer panel set to AppState.dom.directionsPanel.");
    } else {
        mapDebugWarn("initAppMap: AppState.dom.directionsPanel not found. Directions text panel will not be populated.");
    }

    if (dom.searchInput) {
        mapDebugLog("initAppMap: AppState.dom.searchInput FOUND. Initializing Autocomplete.");
        const autocompleteOptions = {
            bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(MAINE_BOUNDS_LITERAL.sw.lat, MAINE_BOUNDS_LITERAL.sw.lng),
                new google.maps.LatLng(MAINE_BOUNDS_LITERAL.ne.lat, MAINE_BOUNDS_LITERAL.ne.lng)
            ),
            strictBounds: true,
            componentRestrictions: { country: "us" },
            fields: ["name", "formatted_address", "geometry", "address_components", "place_id", "types"],
        };
        mapDebugLog("initAppMap: Autocomplete options:", autocompleteOptions);
        autocomplete = new google.maps.places.Autocomplete(dom.searchInput, autocompleteOptions);
        mapDebugLog("initAppMap: google.maps.places.Autocomplete CREATED for searchInput.");

        autocomplete.addListener("place_changed", () => {
            mapDebugLog("Autocomplete 'place_changed' event triggered.");
            AppState.lastPlaceSelectedByAutocomplete = null;
            const place = autocomplete.getPlace();
            mapDebugLog("Autocomplete 'place_changed': place object:", place);

            if (!place?.geometry?.location) {
                mapDebugWarn("Autocomplete 'place_changed': Place invalid or no geometry for input:", dom.searchInput.value);
                if (typeof handleSearch === "function") {
                    mapDebugLog("Autocomplete 'place_changed': Calling handleSearch() for typed text.");
                    handleSearch();
                } else { mapDebugWarn("Autocomplete 'place_changed': handleSearch function not found.");}
                return;
            }

            let displayAddress = place.formatted_address || place.name || dom.searchInput.value;
            if (place.formatted_address) {
                displayAddress = displayAddress.replace(/, USA$/, "").trim();
            }
            dom.searchInput.value = displayAddress;
            AppState.lastPlaceSelectedByAutocomplete = place;
            mapDebugLog("Autocomplete 'place_changed': AppState.lastPlaceSelectedByAutocomplete SET:", AppState.lastPlaceSelectedByAutocomplete);
            mapDebugLog("Autocomplete 'place_changed': dom.searchInput.value SET to:", displayAddress);

            const targetLocation = place.geometry.location;
            mapDebugLog("Autocomplete 'place_changed': Target location:", targetLocation.toString());
            const adjustedCenter = getAdjustedMapCenter(targetLocation); // Ensure this is defined and callable
            mapDebugLog("Autocomplete 'place_changed': Adjusted map center pre-pan:", adjustedCenter.toString ? adjustedCenter.toString() : JSON.stringify(adjustedCenter));
            map.setCenter(adjustedCenter);
            map.setZoom(DEFAULT_MAP_ZOOM);
            mapDebugLog("Autocomplete 'place_changed': Map centered and zoomed. Current center:", map.getCenter().toString(), "Zoom:", map.getZoom());


            if (typeof handleSearch === "function") {
                 mapDebugLog("Autocomplete 'place_changed': Calling handleSearch().");
                 handleSearch();
            } else { mapDebugWarn("Autocomplete 'place_changed': handleSearch function not found.");}
        });
    } else {
        mapDebugWarn("initAppMap: AppState.dom.searchInput NOT FOUND. Autocomplete will not be initialized.");
    }

    map.addListener("click", (e) => {
        mapDebugLog("Map 'click' event triggered. Event object:", e, "Place ID from event:", e.placeId);
        if (e.placeId) { e.stop(); mapDebugLog("Map 'click': Click was on a map POI (placeId present), event stopped.");}
        if (AppState.markerClickedRecently) { mapDebugLog("Map 'click': AppState.markerClickedRecently is true, returning early."); return;}
        if (infowindow) { infowindow.close(); mapDebugLog("Map 'click': InfoWindow closed."); }

        if (AppState.dom.detailsOverlayShopElement?.classList.contains("is-open") ||
            AppState.dom.detailsOverlaySocialElement?.classList.contains("is-open")) {
            mapDebugLog("Map 'click': Overlays are open.");
            if (typeof closeClickedShopOverlaysAndNavigateHome === "function") {
                mapDebugLog("Map 'click': Calling closeClickedShopOverlaysAndNavigateHome().");
                closeClickedShopOverlaysAndNavigateHome();
            } else { mapDebugWarn("Map 'click': closeClickedShopOverlaysAndNavigateHome function not found."); }
        } else {
            mapDebugLog("Map 'click': No overlays open or AppState elements missing.");
        }
    });

    map.addListener("idle", () => {
        const currentMapCenter = map.getCenter();
        mapDebugLog("Map 'idle' event triggered. Current map center:", currentMapCenter ? currentMapCenter.toString() : 'N/A');
        if (currentMapCenter && AppState.currentlyDisplayedShops && AppState.currentlyDisplayedShops.length > 0 && typeof renderListings === "function") {
            if (!AppState.lastPlaceSelectedByAutocomplete?.geometry) {
                mapDebugLog("Map 'idle': Not an autocomplete search result. Calling renderListings() to re-sort by new map center.");
                renderListings(AppState.currentlyDisplayedShops, true, currentMapCenter);
            } else {
                 mapDebugLog("Map 'idle': Is an autocomplete search result, not re-sorting listings by map center.");
            }
        } else {
             mapDebugLog("Map 'idle': Conditions not met for re-sorting listings.",
                "currentMapCenter defined:", !!currentMapCenter,
                "currentlyDisplayedShops defined & populated:", !!AppState.currentlyDisplayedShops && AppState.currentlyDisplayedShops.length > 0,
                "renderListings defined:", typeof renderListings === 'function');
        }
    });

    const initialAdjustedCenter = getAdjustedMapCenter(DEFAULT_MAP_CENTER);
    mapDebugLog("initAppMap: Initial adjusted map center for map.setCenter:", initialAdjustedCenter.toString ? initialAdjustedCenter.toString() : JSON.stringify(initialAdjustedCenter));
    map.setCenter(initialAdjustedCenter);
    mapDebugLog("initAppMap: Initial map center set.");

    if (typeof processAndPlotShops === "function") {
        mapDebugLog("initAppMap: Calling processAndPlotShops() from main.js.");
        processAndPlotShops();
    } else {
        mapDebugError("initAppMap: CRITICAL - processAndPlotShops function NOT FOUND (expected in main.js). Data will not load.");
    }
    mapDebugLog("initAppMap: Initialization sequence COMPLETE.");
}

async function calculateAndDisplayRoute(destinationShopData) {
    mapDebugLog("calculateAndDisplayRoute: CALLED. DestinationShopData:", destinationShopData);
    const dom = AppState.dom;

    if (!directionsRenderer) { mapDebugError("calculateAndDisplayRoute: Directions Renderer not initialized."); alert("Directions service is unavailable."); return; }
    if (!destinationShopData) { mapDebugError("calculateAndDisplayRoute: No destination data provided."); alert("Destination needed for directions."); return; }

    mapDebugLog("calculateAndDisplayRoute: Clearing previous route from directionsRenderer.");
    directionsRenderer.setDirections({ routes: [] });
    if (dom.directionsPanel) { dom.directionsPanel.innerHTML = ""; mapDebugLog("calculateAndDisplayRoute: Cleared AppState.dom.directionsPanel.");}

    let origin;
    if (AppState.lastPlaceSelectedByAutocomplete?.geometry?.location) {
        const loc = AppState.lastPlaceSelectedByAutocomplete.geometry.location;
        origin = `${loc.lat()},${loc.lng()}`;
        mapDebugLog("calculateAndDisplayRoute: Origin derived from AppState.lastPlaceSelectedByAutocomplete:", origin);
    } else if (dom.searchInput?.value.trim()) {
        origin = dom.searchInput.value.trim();
        mapDebugLog("calculateAndDisplayRoute: Origin derived from AppState.dom.searchInput value:", origin);
    } else {
        mapDebugLog("calculateAndDisplayRoute: No autocomplete or search input. Prompting for origin.");
        const fallbackOrigin = prompt("Please enter your starting address for directions:", `${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.lng}`);
        if (!fallbackOrigin) { alert("Starting location is needed for directions."); mapDebugWarn("calculateAndDisplayRoute: User did not provide fallback origin."); return; }
        origin = fallbackOrigin;
        mapDebugLog("calculateAndDisplayRoute: Origin from prompt:", origin);
    }

    let destinationApiArg;
    if (destinationShopData.lat && destinationShopData.lng) {
        destinationApiArg = `${parseFloat(destinationShopData.lat)},${parseFloat(destinationShopData.lng)}`;
        mapDebugLog("calculateAndDisplayRoute: Destination API Arg (lat/lng):", destinationApiArg);
    } else if (destinationShopData.GoogleProfileID) {
        destinationApiArg = `place_id:${destinationShopData.GoogleProfileID}`;
        mapDebugLog("calculateAndDisplayRoute: Destination API Arg (Place ID):", destinationApiArg);
    } else if (destinationShopData.Address && destinationShopData.Address !== 'N/A') {
        destinationApiArg = destinationShopData.Address;
        mapDebugLog("calculateAndDisplayRoute: Destination API Arg (Address):", destinationApiArg);
    } else {
        const shopName = destinationShopData.Name || "the selected shop";
        alert(`Cannot get directions to "${escapeHTML(shopName)}" due to missing location information.`);
        mapDebugWarn("calculateAndDisplayRoute: Not enough info for destination:", shopName, destinationShopData);
        return;
    }
    mapDebugLog(`calculateAndDisplayRoute: Attempting to get directions from "${origin}" to "${destinationApiArg}"`);

    try {
        const directionsResult = await getDirectionsClient(origin, destinationApiArg);
        mapDebugLog("calculateAndDisplayRoute: getDirectionsClient response:", directionsResult);
        if (directionsResult && directionsResult.status === google.maps.DirectionsStatus.OK) {
            mapDebugLog("calculateAndDisplayRoute: Directions request OK. Setting directions on renderer.");
            directionsRenderer.setDirections(directionsResult);
            if(dom.getShopDirectionsButton) { dom.getShopDirectionsButton.classList.add('hidden'); mapDebugLog("calculateAndDisplayRoute: Hid getShopDirectionsButton."); }
            if(dom.clearShopDirectionsButton) { dom.clearShopDirectionsButton.classList.remove('hidden'); mapDebugLog("calculateAndDisplayRoute: Showed clearShopDirectionsButton.");}

            if (directionsResult.routes?.[0]?.legs?.[0]?.start_location && map) {
                 const startLoc = directionsResult.routes[0].legs[0].start_location;
                 const startLocLatLng = new google.maps.LatLng(startLoc.lat, startLoc.lng);
                 mapDebugLog("calculateAndDisplayRoute: Start location of route:", startLocLatLng.toString());
                 const adjustedStartCenter = getAdjustedMapCenter(startLocLatLng);
                 mapDebugLog("calculateAndDisplayRoute: Adjusted center for map panTo:", adjustedStartCenter.toString ? adjustedStartCenter.toString() : JSON.stringify(adjustedStartCenter));
                 map.panTo(adjustedStartCenter);
                 mapDebugLog("calculateAndDisplayRoute: Map panned to start of route. Current map center:", map.getCenter().toString());
            }
        } else {
            const statusMsg = directionsResult ? directionsResult.status : "Unknown error from server.";
            window.alert("Directions request failed: " + statusMsg);
            mapDebugError("calculateAndDisplayRoute: Directions request failed. Status:", statusMsg, "Full result:", directionsResult);
        }
    } catch (error) {
        window.alert("Error calculating directions: " + error.message);
        mapDebugError("calculateAndDisplayRoute: Exception during API call or processing.", error);
    }
}

function clearDirections() {
    mapDebugLog("clearDirections: CALLED.");
    const dom = AppState.dom;
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
        mapDebugLog("clearDirections: Cleared routes from directionsRenderer.");
    }
    if (dom.directionsPanel) {
        dom.directionsPanel.innerHTML = "";
        mapDebugLog("clearDirections: Cleared AppState.dom.directionsPanel HTML.");
    }
    if(dom.getShopDirectionsButton) { dom.getShopDirectionsButton.classList.remove('hidden'); mapDebugLog("clearDirections: Showed getShopDirectionsButton."); }
    if(dom.clearShopDirectionsButton) { dom.clearShopDirectionsButton.classList.add('hidden'); mapDebugLog("clearDirections: Hid clearShopDirectionsButton."); }
    mapDebugLog("clearDirections: Process COMPLETE.");
}

function plotMarkers(shopsToPlot) {
    mapDebugLog("plotMarkers: CALLED. shopsToPlot count:", shopsToPlot ? shopsToPlot.length : 'N/A', "Sample:", shopsToPlot ? JSON.stringify(shopsToPlot.slice(0,1)) : "N/A");

    if (shopsToPlot && shopsToPlot.length > 0) {
        const firstShop = shopsToPlot[0];
        mapDebugLog("[MARKER_DEBUG] plotMarkers: Starting. First shop in shopsToPlot: " + firstShop.Name + ". Has marker property? " + firstShop.hasOwnProperty('marker') + ". Is marker null? " + (firstShop.marker === null) + ". Shop slug: " + firstShop.slug);
    } else {
        mapDebugLog("[MARKER_DEBUG] plotMarkers: Starting. shopsToPlot is empty or null.");
    }

    mapDebugLog("plotMarkers: Clearing existing markers from AppState.allFarmStands.");
    let clearedCount = 0;
    (AppState.allFarmStands || []).forEach(s => { if (s.marker) { s.marker.setMap(null); s.marker = null; clearedCount++; } });
    mapDebugLog("plotMarkers: Number of old markers cleared:", clearedCount);


    if (!shopsToPlot || shopsToPlot.length === 0) {
        mapDebugLog("plotMarkers: No shops to plot or shopsToPlot is null/empty. Exiting.");
        return;
    }

    shopsToPlot.forEach((shop, index) => {
        mapDebugLog(`plotMarkers: Processing shop [${index}] for marker: ${shop.Name}`);
        if (shop.lat != null && shop.lng != null) {
            mapDebugLog(`plotMarkers: Shop ${shop.Name} (Lat: ${shop.lat}, Lng: ${shop.lng}) has coords. Calling createMarkerForShop.`);
            createMarkerForShop(shop);
        } else {
            mapDebugWarn(`plotMarkers: SKIPPING marker creation for ${shop.Name} due to missing lat/lng. Shop data:`, shop);
        }
    });
    mapDebugLog("plotMarkers: Finished processing all shops for plotting.");
    mapDebugLog("[MARKER_DEBUG] plotMarkers: Finished processing all shops for plotting.");
}

function createMarkerForShop(shop) {
    mapDebugLog(`createMarkerForShop: CALLED for shop: ${shop.Name}. Shop data (coords only): Lat=${shop.lat}, Lng=${shop.lng}`);

    const lat = parseFloat(shop.lat);
    const lng = parseFloat(shop.lng);

    if (isNaN(lat) || isNaN(lng)) {
        mapDebugWarn(`createMarkerForShop: Invalid parsed lat/lng for ${shop.Name}. Parsed Lat: ${lat}, Lng: ${lng}. SKIPPING marker creation.`);
        return;
    }

    if (typeof map === 'undefined' || !map) {
        mapDebugError("createMarkerForShop: CRITICAL - Google Maps 'map' object is NOT defined. Cannot create marker.");
        return;
    }
    mapDebugLog("createMarkerForShop: 'map' object IS defined.");

    const iconConfig = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: markerColor, // Ensure markerColor is defined (from config.js)
        fillOpacity: 0.9,
        strokeColor: "#ffffff",
        strokeWeight: 1.5,
        scale: 8,
    };
    mapDebugLog(`createMarkerForShop: Icon config for ${shop.Name}:`, JSON.stringify(iconConfig), "Using markerColor:", markerColor);

    try {
        const newMarker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: shop.Name,
            icon: iconConfig,
            zIndex: 1
        });
        shop.marker = newMarker; // Assign to shop object
        mapDebugLog("[MARKER_DEBUG] createMarkerForShop: Marker ASSIGNED to shop: " + shop.Name + ". Marker ZIndex:", newMarker.getZIndex ? newMarker.getZIndex() : 'N/A');
        mapDebugLog(`createMarkerForShop: SUCCESS - Marker CREATED and assigned for ${shop.Name} at ${lat}, ${lng}. Marker object:`, newMarker);
    } catch (error) {
        mapDebugError(`createMarkerForShop: ERROR creating google.maps.Marker for ${shop.Name}:`, error, "Shop Data:", shop);
        return; // Don't try to add listener if marker creation failed
    }

    if (!shop.marker) { // Double check, though previous catch should handle it
        mapDebugError(`createMarkerForShop: Marker object still null after creation attempt for ${shop.Name}. Aborting listener attachment.`);
        return;
    }
    
    mapDebugLog(`createMarkerForShop: Adding 'click' listener to marker for ${shop.Name}.`);
    shop.marker.addListener("click", () => {
        mapDebugLog(`Marker CLICKED for shop: ${shop.Name}. Shop slug: ${shop.slug}`);
        AppState.markerClickedRecently = true;
        mapDebugLog("Marker click: AppState.markerClickedRecently set to true.");
        if (shop.marker) {
            shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
            mapDebugLog(`Marker click: Z-index set for ${shop.Name}'s marker.`);
        }

        mapDebugLog(`Marker click: Checking navigateToStoreBySlug. Slug: '${shop.slug}', Function typeof: ${typeof navigateToStoreBySlug}`);
        if (shop.slug && typeof navigateToStoreBySlug === 'function') {
            mapDebugLog(`Marker click: Calling navigateToStoreBySlug for ${shop.Name} with slug ${shop.slug}.`);
            navigateToStoreBySlug(shop);
        } else {
            mapDebugWarn(`Marker click: Fallback for ${shop.Name}. Shop slug: '${shop.slug}', navigateToStoreBySlug defined: ${typeof navigateToStoreBySlug === 'function'}. Opening overlays directly.`);
            if (typeof openClickedShopOverlays === 'function') {
                mapDebugLog(`Marker click (fallback): Calling openClickedShopOverlays for ${shop.Name}.`);
                openClickedShopOverlays(shop);
            } else {
                 mapDebugWarn(`Marker click (fallback): openClickedShopOverlays function NOT defined.`);
            }
            setTimeout(() => {
                mapDebugLog(`Marker click (fallback): Calling showInfoWindowForShop for ${shop.Name} after delay.`);
                showInfoWindowForShop(shop);
            }, 100);
        }
        mapDebugLog(`Marker click: Handler for ${shop.Name} finished initial calls.`);
        setTimeout(() => { AppState.markerClickedRecently = false; mapDebugLog("Marker click: AppState.markerClickedRecently reset to false after 300ms."); }, 300);
    });
    mapDebugLog(`createMarkerForShop: 'click' listener ADDED for ${shop.Name}.`);
}

async function showInfoWindowForShop(shop) {
    mapDebugLog(`showInfoWindowForShop: CALLED for shop: ${shop ? shop.Name : 'NULL shop'}. Shop object sample (ID, name, marker status):`, shop ? {id: shop.slug || shop.GoogleProfileID, name:shop.Name, hasMarker: !!shop.marker } : "N/A");
    if (!shop) { mapDebugError("showInfoWindowForShop: No shop provided. Exiting."); return; }

    const position = shop.marker?.getPosition() ||
                     (shop.lat != null && shop.lng != null ? { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng) } : null);
    mapDebugLog(`showInfoWindowForShop: Determined position for ${shop.Name}:`, position ? (position.lat + ',' + position.lng) : 'NULL');


    if (!position) {
        mapDebugWarn(`showInfoWindowForShop: No valid position derived for ${shop.Name}. Cannot open InfoWindow.`);
        if (infowindow) { infowindow.close(); mapDebugLog("showInfoWindowForShop: Closed existing infowindow (no position case).");}
        return;
    }

    if (!map) { mapDebugError("showInfoWindowForShop: Google Maps 'map' object is UNDEFINED! Cannot open InfoWindow."); return; }
    if (!infowindow) { mapDebugError("showInfoWindowForShop: Google Maps 'infowindow' object is UNDEFINED! Cannot open InfoWindow."); return; }
    mapDebugLog("showInfoWindowForShop: 'map' and 'infowindow' objects seem OK.");

    mapDebugLog(`showInfoWindowForShop: Current map center BEFORE InfoWindow opening (might be panned by displayStorePageBySlug): ${map.getCenter().toString()}`);
    // Optional: If direct infowindow opening needs its own pan (can conflict if called from navigateToStoreBySlug which also pans)
    // mapDebugLog(`showInfoWindowForShop: About to pan map to adjusted center of: ${position.lat()},${position.lng()}`);
    // const adjustedInfowWindowCenter = getAdjustedMapCenter(position);
    // map.panTo(adjustedInfowWindowCenter);
    // mapDebugLog(`showInfoWindowForShop: Map panned to ${adjustedInfowWindowCenter.toString ? adjustedInfowWindowCenter.toString() : JSON.stringify(adjustedInfowWindowCenter)}. Current center: ${map.getCenter().toString()}`);
    
    infowindow.close();
    mapDebugLog(`showInfoWindowForShop: Closed any existing infowindow for ${shop.Name}.`);

    (AppState.allFarmStands || []).forEach(s => { if (s.marker && s !== shop) s.marker.setZIndex(1); });
    if (shop.marker) { shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1); mapDebugLog(`showInfoWindowForShop: Set zIndex for ${shop.Name}'s marker.`); }
    else { mapDebugWarn(`showInfoWindowForShop: Shop ${shop.Name} has NO marker object. Cannot set zIndex.`); }

    mapDebugLog(`showInfoWindowForShop: GoogleProfileID for ${shop.Name}: ${shop.GoogleProfileID}. Current placeDetails:`, shop.placeDetails);
    if (shop.GoogleProfileID && (!shop.placeDetails || shop.placeDetails.rating === undefined || !shop.placeDetails.formatted_address)) { // Fetch if rating or address missing
        mapDebugLog(`showInfoWindowForShop: Fetching G-Place Details for ${shop.Name} (ID: ${shop.GoogleProfileID}) via backend.`);
        const fieldsToFetch = 'name,rating,user_ratings_total,formatted_address,website,url'; // url for "view all reviews" link
        const placeDetails = await getPlaceDetailsClient(shop.GoogleProfileID, fieldsToFetch);
        mapDebugLog(`showInfoWindowForShop: G-Place Details fetched for ${shop.Name}:`, placeDetails);
        if (placeDetails) {
            shop.placeDetails = { ...(shop.placeDetails || {}), ...placeDetails };
            mapDebugLog(`showInfoWindowForShop: shop.placeDetails for ${shop.Name} UPDATED:`, shop.placeDetails);
        } else {
            mapDebugWarn(`showInfoWindowForShop: G-Place Details fetch FAILED or returned null for ${shop.Name}.`);
        }
    } else {
        mapDebugLog(`showInfoWindowForShop: Using existing G-Place Details for ${shop.Name} or no GoogleProfileID.`);
    }

    if (typeof generateShopContentHTML === 'function') {
        mapDebugLog(`showInfoWindowForShop: Attempting to call generateShopContentHTML for ${shop.Name} (context: 'infowindow').`);
        let content = '';
        try {
            content = generateShopContentHTML(shop, 'infowindow');
            mapDebugLog(`showInfoWindowForShop: generateShopContentHTML returned for ${shop.Name} (first 100 chars):`, content ? content.substring(0,100) : "EMPTY_CONTENT_RETURNED");
        } catch (e) {
            mapDebugError(`showInfoWindowForShop: ERROR during generateShopContentHTML call for ${shop.Name}:`, e);
            content = `<div style="padding:10px; color:red;">Error generating shop details for InfoWindow (see console).</div>`;
        }

        if (content && content.trim() !== "") {
            mapDebugLog(`showInfoWindowForShop: Setting content and calling infowindow.open() for ${shop.Name}. Anchor is shop.marker:`, shop.marker);
            infowindow.setContent(content);
            infowindow.open({ anchor: shop.marker, map: map, shouldFocus: false });
            mapDebugLog(`showInfoWindowForShop: infowindow.open() CALLED for ${shop.Name}.`);
        } else {
            mapDebugWarn(`showInfoWindowForShop: generateShopContentHTML returned empty/whitespace content for ${shop.Name}. InfoWindow NOT opened.`);
        }
    } else {
        mapDebugError("showInfoWindowForShop: generateShopContentHTML function NOT FOUND (expected in sharedHtml.js). Cannot populate InfoWindow.");
    }
}

function getAdjustedMapCenter(targetCenterInput) {
    mapDebugLog("getAdjustedMapCenter: CALLED. targetCenterInput:", targetCenterInput.toString ? targetCenterInput.toString() : JSON.stringify(targetCenterInput));
    const dom = AppState.dom;
    console.log("[CENTERING_DEBUG] getAdjustedMapCenter called. Map dimensions:", map.getDiv().offsetWidth, "x", map.getDiv().offsetHeight);
    if (!map?.getDiv || !map.getBounds() || !map.getProjection()) {
        mapDebugWarn("getAdjustedMapCenter: Map not ready or missing properties (getDiv/getBounds/getProjection). Returning targetCenterInput directly.", "map exists:", !!map);
        return targetCenterInput;
    }

    let targetLat, targetLng;
    if (targetCenterInput?.lat && typeof targetCenterInput.lat === 'function') { // Google LatLng object
        targetLat = targetCenterInput.lat();
        targetLng = targetCenterInput.lng();
    } else if (targetCenterInput?.lat && typeof targetCenterInput.lat === 'number') { // Plain {lat, lng} object
        targetLat = targetCenterInput.lat;
        targetLng = targetCenterInput.lng;
    } else {
        mapDebugWarn("getAdjustedMapCenter: targetCenterInput is not a recognized LatLng format. Falling back to current map center or default.");
        const currentMapCenter = map.getCenter();
        if (!currentMapCenter) {
             mapDebugLog("getAdjustedMapCenter: Fallback - currentMapCenter is null, returning DEFAULT_MAP_CENTER.");
             return DEFAULT_MAP_CENTER;
        }
        mapDebugLog("getAdjustedMapCenter: Fallback - returning currentMapCenter.", { lat: currentMapCenter.lat(), lng: currentMapCenter.lng() });
        return { lat: currentMapCenter.lat(), lng: currentMapCenter.lng() };
    }
    mapDebugLog(`getAdjustedMapCenter: Resolved targetLat: ${targetLat}, targetLng: ${targetLng}`);

    const mapDiv = map.getDiv();
    const mapWidthPx = mapDiv.offsetWidth;
    mapDebugLog(`getAdjustedMapCenter: mapDiv.offsetWidth: ${mapWidthPx}px`);
    let panelLeftPx = 0;
    let panelRightPx = 0;

    // Left Panel (Social)
    const socialPanel = dom.detailsOverlaySocialElement;
    const socialIsOpen = socialPanel?.classList.contains("is-open");
    const socialDisplay = socialPanel ? getComputedStyle(socialPanel).display : "null";
    const socialOffsetWidth = socialPanel?.offsetWidth;
    console.log("[CENTERING_DEBUG] Social Panel: isOpen:", socialIsOpen, "display:", socialDisplay, "offsetWidth:", socialOffsetWidth);
    if (socialIsOpen && socialDisplay !== "none" ) {
        panelLeftPx = socialOffsetWidth;
        mapDebugLog(`getAdjustedMapCenter: detailsOverlaySocialElement is OPEN. Width: ${panelLeftPx}px`); // Keep original mapDebugLog
    }

    // Right Panel (Shop Details)
    const shopPanel = dom.detailsOverlayShopElement;
    const shopIsOpen = shopPanel?.classList.contains("is-open");
    const shopDisplay = shopPanel ? getComputedStyle(shopPanel).display : "null";
    const shopOffsetWidth = shopPanel?.offsetWidth;
    console.log("[CENTERING_DEBUG] Shop Panel: isOpen:", shopIsOpen, "display:", shopDisplay, "offsetWidth:", shopOffsetWidth);
    if (shopIsOpen && shopDisplay !== "none") {
        panelRightPx = shopOffsetWidth;
        mapDebugLog(`getAdjustedMapCenter: detailsOverlayShopElement is OPEN. Width: ${panelRightPx}px`); // Keep original mapDebugLog
    } else {
        // Right Panel (Listings - fallback if shop panel not open)
        const listingsPanel = dom.listingsPanelElement;
        const listingsIsVisible = listingsPanel && getComputedStyle(listingsPanel).display !== "none" && listingsPanel.offsetWidth > 0 && window.innerWidth >= 768;
        const listingsOffsetWidth = listingsPanel?.offsetWidth;
        console.log("[CENTERING_DEBUG] Listings Panel (fallback): isVisible (desktop):", listingsIsVisible, "offsetWidth:", listingsOffsetWidth, "window.innerWidth:", window.innerWidth);
        if (listingsIsVisible) {
            panelRightPx = listingsOffsetWidth;
            mapDebugLog(`getAdjustedMapCenter: listingsPanelElement is VISIBLE (md+). Width: ${panelRightPx}px`); // Keep original mapDebugLog
        }
    }

    if ((panelLeftPx <= 0 && panelRightPx <= 0) || mapWidthPx <= 0) {
        mapDebugLog("getAdjustedMapCenter: No panels open or mapWidth is 0. No adjustment needed. Returning original target.", { lat: targetLat, lng: targetLng });
        return { lat: targetLat, lng: targetLng };
    }

    const netPixelShift = (panelLeftPx - panelRightPx) / 2;
    mapDebugLog(`getAdjustedMapCenter: netPixelShift: ${netPixelShift}px (Positive means visible map area shifted right)`); // Keep original
    console.log("[CENTERING_DEBUG] Calculated panelLeftPx:", panelLeftPx, "panelRightPx:", panelRightPx, "netPixelShift:", netPixelShift);
    const currentMapBounds = map.getBounds();
    if (!currentMapBounds) {
        mapDebugWarn("getAdjustedMapCenter: currentMapBounds is null! Cannot calculate lngSpan. Returning unadjusted target.", { lat: targetLat, lng: targetLng });
        return { lat: targetLat, lng: targetLng };
    }

    const lngSpan = currentMapBounds.toSpan().lng();
    const degreesPerPixelLng = lngSpan / mapWidthPx;
    mapDebugLog(`getAdjustedMapCenter: lngSpan: ${lngSpan}, degreesPerPixelLng: ${degreesPerPixelLng}`);
    
    const adjustedLng = targetLng - (netPixelShift * degreesPerPixelLng);
    const finalAdjustedCenter = { lat: targetLat, lng: adjustedLng };
    mapDebugLog("getAdjustedMapCenter: FINAL adjusted center:", finalAdjustedCenter); // Keep original
    console.log("[CENTERING_DEBUG] Final adjustedLng:", adjustedLng, "Original targetLng:", targetLng);
    return finalAdjustedCenter;
}

function getAdjustedBounds(originalBounds) {
    mapDebugLog("getAdjustedBounds: CALLED. originalBounds:", originalBounds ? originalBounds.toString() : 'N/A');
    const dom = AppState.dom;
    if (!map?.getDiv || !originalBounds || !map.getProjection || typeof map.getZoom !== 'function') {
        mapDebugWarn("getAdjustedBounds: Map not ready or missing properties/originalBounds. Returning originalBounds directly.", "map defined:", !!map, "originalBounds defined:", !!originalBounds);
        return originalBounds;
    }

    const mapDiv = map.getDiv();
    const mapWidth = mapDiv.offsetWidth;
    mapDebugLog(`getAdjustedBounds: mapDiv.offsetWidth: ${mapWidth}px`);
    let panelLeftOffset = 0;
    let panelRightOffset = 0;

    if (dom.detailsOverlaySocialElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlaySocialElement).display !== "none") {
        panelLeftOffset = dom.detailsOverlaySocialElement.offsetWidth;
        mapDebugLog(`getAdjustedBounds: detailsOverlaySocialElement is OPEN. Width: ${panelLeftOffset}px`);
    }
    if (dom.detailsOverlayShopElement?.classList.contains("is-open") && getComputedStyle(dom.detailsOverlayShopElement).display !== "none") {
        panelRightOffset = dom.detailsOverlayShopElement.offsetWidth;
        mapDebugLog(`getAdjustedBounds: detailsOverlayShopElement is OPEN. Width: ${panelRightOffset}px`);
    } else if (dom.listingsPanelElement && getComputedStyle(dom.listingsPanelElement).display !== "none" && dom.listingsPanelElement.offsetWidth > 0 && window.innerWidth >= 768) { // md breakpoint
        panelRightOffset = dom.listingsPanelElement.offsetWidth;
        mapDebugLog(`getAdjustedBounds: listingsPanelElement is VISIBLE (md+). Width: ${panelRightOffset}px`);
    }

    if ((panelLeftOffset <= 0 && panelRightOffset <= 0) || mapWidth <= 0) {
        mapDebugLog("getAdjustedBounds: No panels affecting bounds or mapWidth is 0. No adjustment needed. Returning originalBounds.");
        return originalBounds;
    }

    const projection = map.getProjection();
    const zoom = map.getZoom();
    if (!projection || typeof zoom === "undefined") {
        mapDebugWarn("getAdjustedBounds: Map projection or zoom undefined. Returning originalBounds.");
        return originalBounds;
    }
    mapDebugLog(`getAdjustedBounds: map.zoom: ${zoom}`);


    const sw = originalBounds.getSouthWest();
    const ne = originalBounds.getNorthEast();
    if (!sw || !ne) { mapDebugWarn("getAdjustedBounds: Invalid SW/NE from originalBounds. Returning originalBounds."); return originalBounds; }
    mapDebugLog(`getAdjustedBounds: Original SW: ${sw.toString()}, NE: ${ne.toString()}`);

    const swPoint = projection.fromLatLngToPoint(sw);
    const nePoint = projection.fromLatLngToPoint(ne);
    if (!swPoint || !nePoint) { mapDebugWarn("getAdjustedBounds: Invalid points from projection (swPoint or nePoint null). Returning originalBounds."); return originalBounds; }
    mapDebugLog(`getAdjustedBounds: Original SW Point (world coords): {x: ${swPoint.x}, y: ${swPoint.y}}, NE Point: {x: ${nePoint.x}, y: ${nePoint.y}}`);

    const worldUnitsPerPixel = Math.pow(2, -zoom);
    const pixelShiftForBounds = (panelRightOffset - panelLeftOffset) / 2;
    const worldOffsetX = pixelShiftForBounds * worldUnitsPerPixel;
    mapDebugLog(`getAdjustedBounds: worldUnitsPerPixel: ${worldUnitsPerPixel}, pixelShiftForBounds: ${pixelShiftForBounds}px, worldOffsetX: ${worldOffsetX} (world units)`);


    const newSwPoint = new google.maps.Point(swPoint.x + worldOffsetX, swPoint.y);
    const newNePoint = new google.maps.Point(nePoint.x + worldOffsetX, nePoint.y);
    mapDebugLog(`getAdjustedBounds: New SW Point (world coords): {x: ${newSwPoint.x}, y: ${newSwPoint.y}}, New NE Point: {x: ${newNePoint.x}, y: ${newNePoint.y}}`);

    const newSw = projection.fromPointToLatLng(newSwPoint);
    const newNe = projection.fromPointToLatLng(newNePoint);

    if (newSw && newNe) {
        const finalAdjustedBounds = new google.maps.LatLngBounds(newSw, newNe);
        mapDebugLog("getAdjustedBounds: FINAL adjusted bounds:", finalAdjustedBounds.toString());
        return finalAdjustedBounds;
    }
    mapDebugWarn("getAdjustedBounds: Failed to create new LatLngBounds from adjusted points (newSw or newNe null). Returning originalBounds.");
    return originalBounds;
}