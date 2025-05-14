// js/mapLogic.js

// Global map variables, initialized in initAppMap
let map;
let geocoder;

function initAppMap() { // This is the callback for Google Maps API
    console.log("initAppMap called");
   
    map = new google.maps.Map(document.getElementById("map"), {
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        mapTypeControl: false,
        styles: mapStyles.maineLicensePlate, // mapStyles from config.js
        gestureHandling: 'greedy'
    });
    geocoder = new google.maps.Geocoder();

    if (map) {
        map.addListener('click', () => {
            if (markerClickedRecently) { // markerClickedRecently from main.js
                console.log("Map click ignored due to recent marker click.");
                return;
            }
            const rightIsOpen = detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open');
            const leftIsOpen = detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open');
            if (rightIsOpen || leftIsOpen) {
                console.log("Map clicked, closing overlays.");
                closeClickedShopOverlays(); // from uiLogic.js
            }
        });

        map.addListener('idle', () => {
            console.log("Map idle, re-sorting listings.");
            const currentMapCenter = map.getCenter();
            if (currentMapCenter && (currentlyDisplayedShops.length > 0 || allButcherShops.length > 0)) {
                let shopsToSort = currentlyDisplayedShops.length > 0 ? [...currentlyDisplayedShops] : [...allButcherShops];
                // If search is active, ensure we are sorting the filtered list
                if (searchInput && searchInput.value.trim() !== '' && shopsToSort.length === allButcherShops.length) {
                     const searchTerm = searchInput.value.toLowerCase().trim();
                     shopsToSort = allButcherShops.filter(shop =>
                        shop.Name.toLowerCase().includes(searchTerm) ||
                        (shop.City && shop.City.toLowerCase().includes(searchTerm)) ||
                        shop.Address.toLowerCase().includes(searchTerm)
                    );
                }
                renderListings(shopsToSort, true, currentMapCenter); // from uiLogic.js
            }
        });
    }

    finalizeMapSetup(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM); // Start the process
}

function finalizeMapSetup(center, zoom) {
    map.setZoom(zoom);
    google.maps.event.addListenerOnce(map, 'idle', () => {
        console.log("Map first idle, setting center and processing shops.");
        map.setCenter(getAdjustedMapCenter(center));
        processAndPlotShops();
    }); 
    if (map.getBounds()) map.setCenter(getAdjustedMapCenter(center)); else map.setCenter(center);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                console.log("User location obtained:", userLocation);
                if (map) {
                     new google.maps.Marker({ /* ... user location marker ... */ });
                    // THE ERROR IS LIKELY HERE:
                    map.setZoom(DEFAULT_ZOOM); // <--- Line 77 (approximately)
                    map.setCenter(getAdjustedMapCenter(userLocation));
                    google.maps.event.addListenerOnce(map, 'idle', () => {
                        renderListings(currentlyDisplayedShops.length ? currentlyDisplayedShops : allButcherShops, true, map.getCenter());
                    });
                }
            },
            (error) => {
                console.warn(`Geolocation Error: ${error.message}. Using default location.`);
                // finalizeMapSetup already called with default, so map is centered there.
                // processAndPlotShops will be called by the initial idle listener.
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
        );
    }
}


function getAdjustedMapCenter(targetCenterInput) {
    if (!map || !map.getDiv()) return targetCenterInput;

    let targetLat, targetLng;
    if (typeof targetCenterInput.lat === 'function') { // Google LatLng object
        targetLat = targetCenterInput.lat();
        targetLng = targetCenterInput.lng();
    } else { // Plain object {lat, lng}
        targetLat = targetCenterInput.lat;
        targetLng = targetCenterInput.lng;
    }
     if (targetLat === undefined || targetLng === undefined) {
        console.error("Invalid targetCenter for getAdjustedMapCenter:", targetCenterInput);
        return map.getCenter(); // Fallback
    }


    const mapDiv = map.getDiv(); const mapWidth = mapDiv.offsetWidth;
    let panelLeftWidth = 0; let panelRightWidth = 0;

    if (detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open')) panelLeftWidth = detailsOverlaySocialElement.offsetWidth;
    if (detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open')) panelRightWidth = detailsOverlayShopElement.offsetWidth;
    else if (listingsPanelElement && getComputedStyle(listingsPanelElement).display !== 'none') panelRightWidth = listingsPanelElement.offsetWidth;

    if ((panelLeftWidth <= 0 && panelRightWidth <= 0) || mapWidth <= 0) return { lat: targetLat, lng: targetLng };
    const bounds = map.getBounds(); if (!bounds) return { lat: targetLat, lng: targetLng };

    const spanLng = bounds.toSpan().lng();
    const occlusionRatio = (panelRightWidth - panelLeftWidth) / mapWidth;
    const lngOffset = spanLng * (occlusionRatio / 2);

    return { lat: targetLat, lng: targetLng + lngOffset };
}

function plotMarkers(shopsToPlot) {
    // Clear only markers that are part of allButcherShops
    allButcherShops.forEach(s => { if (s.marker) s.marker.setMap(null); });

    shopsToPlot.forEach(shop => {
        if (shop.lat && shop.lng) { // If lat/lng already known (e.g. from previous geocoding)
            createMarkerForShop(shop);
        } else if (shop.GoogleProfileID) {
            const service = new google.maps.places.PlacesService(map);
            service.getDetails({ placeId: shop.GoogleProfileID, fields: ['geometry'] }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    shop.lat = place.geometry.location.lat(); shop.lng = place.geometry.location.lng();
                    createMarkerForShop(shop);
                } else if (shop.Address && shop.Address !== 'N/A') geocodeAddressFallback(shop);
            });
        } else if (shop.Address && shop.Address !== 'N/A') {
            geocodeAddressFallback(shop);
        }
    });
}

function geocodeAddressFallback(shop) {
    if (!geocoder) { console.error("Geocoder not initialized"); return; }
    geocoder.geocode({ 'address': shop.Address + ', Maine, USA' }, (results, status) => {
        if (status === 'OK' && results[0]?.geometry) {
            shop.lat = results[0].geometry.location.lat(); shop.lng = results[0].geometry.location.lng();
            createMarkerForShop(shop);
        } else console.warn(`Geocode fallback failed for ${shop.Name}: ${status}`);
    });
}

function createMarkerForShop(shop) {
    if (shop.marker) shop.marker.setMap(null); // Clear previous marker for this shop if any
    if (shop.lat === undefined || shop.lng === undefined) {
        // console.warn("Attempted to create marker for shop without lat/lng:", shop.Name);
        return;
    }
    const iconConfig = { path: google.maps.SymbolPath.CIRCLE, fillColor: markerColor, fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 1.5, scale: 8 };
    shop.marker = new google.maps.Marker({ position: { lat: shop.lat, lng: shop.lng }, map, title: shop.Name, icon: iconConfig });
    shop.marker.addListener('click', () => {
        markerClickedRecently = true; // from main.js
        openClickedShopOverlays(shop); // from uiLogic.js
        setTimeout(() => { markerClickedRecently = false; }, 100);
    });
}