
function handleRouteChange() {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] handleRouteChange called. Path:", window.location.pathname);
    const path = window.location.pathname;
    const slugMatch = path.match(/^\/farm\/(.+)/);

    if (slugMatch && slugMatch[1]) {
        const storeSlug = slugMatch[1];
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Matched store slug:", storeSlug);
        
        const processSlugDisplay = async () => {
            if (!AppState.allFarmStands || AppState.allFarmStands.length === 0) {
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Route change (slug): allFarmStands empty, fetching first.");
                await processAndPlotShops(); // This will fetch data and call handleSearch internally if needed
            }
            await displayStorePageBySlug(storeSlug); // displayStorePageBySlug will handle map centering and cookie
        };
        processSlugDisplay();

    } else { // Home page or other non-farm-detail routes
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Route change: No slug, likely home page. Closing overlays.");
        if (typeof closeClickedShopOverlays === "function") closeClickedShopOverlays();
        
        if (path === '/') {
            // If map exists and data is there, just re-run search/render for current context
            // If map doesn't exist, processAndPlotShops will handle it (and map load if cookie exists)
            if (window.map && AppState.allFarmStands?.length > 0) {
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Route change (home): Map & stands exist. Calling handleSearch.");
                handleSearch();
            } else {
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Route change (home): Map or stands don't exist. Calling processAndPlotShops.");
                processAndPlotShops();
            }
        }
    }
}

async function displayStorePageBySlug(storeSlug) {
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug called for slug:", storeSlug);
    if (!storeSlug) return;

    const shop = AppState.allFarmStands.find(s => s.slug === storeSlug);
    if (shop) {
        if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Shop found for slug:", shop.Name);

        // Set location context from this shop
        if (shop.lat != null && shop.lng != null) {
            const shopLocationForCookie = {
                name: shop.Name,
                formatted_address: shop.Address, // Use shop's address
                geometry: {
                    location: { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng) },
                    // viewport: shop.placeDetails?.geometry?.viewport // Could use this if available from placeDetails
                },
                // place_id: shop.GoogleProfileID // Could add if needed
            };
            AppState.lastPlaceSelectedByAutocomplete = shopLocationForCookie;
            setCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME, JSON.stringify({ term: shop.Name, place: shopLocationForCookie }), COOKIE_EXPIRY_DAYS);
            if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] Cookie set for farm stand:", shop.Name);

            // If map isn't loaded yet, initialize it now, centered on this shop
            if (!window.map) {
                if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] displayStorePageBySlug: Map not loaded. Attempting initialization for farm stand.");
                if (typeof attemptMapInitialization === "function") {
                    await attemptMapInitialization(); // Ensure this can be awaited if performMapSetup is async
                    if (!window.map) {
                        console.error("[main.js_DEBUG] displayStorePageBySlug: Failed to initialize map.");
                        // Proceed to open overlays anyway, but map features won't work
                    }
                }
            }
        }
        // This function also handles map panning/zooming and infowindow
        _openShopDetailsAndMapFeatures(shop);
    } else {
        if (DEBUG_MAIN_JS) console.warn("[main.js_DEBUG] Shop not found for slug:", storeSlug, ". Navigating to home.");
        if (typeof closeClickedShopOverlays === "function") closeClickedShopOverlays();
        window.history.pushState({}, "", "/"); 
        handleRouteChange(); // Re-evaluate for home page
    }
}

async function _openShopDetailsAndMapFeatures(shop) {
    // ... (Full function from your main.js, ensure it calls map.panTo, map.setZoom if map exists) ...
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] _openShopDetailsAndMapFeatures for:", shop.Name);
    if (!shop) return;

    if (typeof openClickedShopOverlays === 'function') {
        openClickedShopOverlays(shop); 
    }
     if (window.map && shop.lat != null && shop.lng != null) {
         const shopLocation = new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng));
         if(typeof getAdjustedMapCenter === "function") map.panTo(getAdjustedMapCenter(shopLocation)); else map.panTo(shopLocation);        
        // Adjust zoom only if currently more zoomed out than the target
        const currentZoom = map.getZoom();
        const targetZoom = USER_LOCATION_MAP_ZOOM || 11; // from config.js
        if (currentZoom < targetZoom) {
            map.setZoom(targetZoom);
        }       
        if (typeof showInfoWindowForShop === 'function') {
             setTimeout(() => showInfoWindowForShop(shop), 100);
         }
     }
    const cardId = `shop-card-${shop.slug || shop.GoogleProfileID || shop.Name?.replace(/\W/g, '') || 'unknown'}`;
    const cardElement = document.getElementById(cardId);
    if (cardElement) { /* ... highlight card ... */ 
        document.querySelectorAll('#listingsContainer .bg-white.rounded-xl').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'));
        cardElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function navigateToStoreBySlug(shop) {
    // ... (Full function from your main.js) ...
    if (!shop || !shop.slug) { if (shop && typeof openClickedShopOverlays === 'function') _openShopDetailsAndMapFeatures(shop); return; }
    const newPath = `/farm/${shop.slug}`;
    if (window.location.pathname !== newPath) window.history.pushState({ storeSlug: shop.slug }, shop.Name || "Details", newPath);
    _openShopDetailsAndMapFeatures(shop); // Always call to ensure overlays/map are correct
}

window.addEventListener('popstate', (event) => { 
    if (DEBUG_MAIN_JS) console.log("[main.js_DEBUG] popstate event triggered. Event state:", event.state);
    if (typeof handleRouteChange === 'function') handleRouteChange(); 
});

// window.handleInfoWindowDirectionsClickById logic needs to be robust
// Best approach: directionsUI.js defines its handler globally, e.g., window.triggerDirectionsFromInfoWindow
// And InfoWindow HTML calls that directly.
window.handleInfoWindowDirectionsClickById = function(shopIdentifier) {
    // This is a fallback/wrapper. The actual function should be in directionsUI.js
    // and ideally exposed more clearly if needed globally.
    if (typeof window.handleInfoWindowDirectionsClickFromUI === 'function') { // Check for the renamed one from directionsUI.js
        window.handleInfoWindowDirectionsClickFromUI(shopIdentifier);
    } else if (typeof handleInfoWindowDirectionsClickById === 'function' && 
               handleInfoWindowDirectionsClickById.name !== "handleInfoWindowDirectionsClickById") {
         // This is a weak check for a globally defined function NOT this wrapper itself
         console.warn("Using a potentially globally defined handleInfoWindowDirectionsClickById, prefer explicit one from directionsUI.js");
         // This assumes an external script defined it globally.
         // This part is risky and ideally directionsUI.js directly handles making its function available.
         // For now, let's assume if it exists and isn't this function, it's the one from directionsUI.
         const externalHandler = window.handleInfoWindowDirectionsClickById; // Store ref
         externalHandler(shopIdentifier); // Call it
    } else { 
        console.error("True handleInfoWindowDirectionsClickById (from directionsUI.js) not found or ambiguous."); 
    }
};