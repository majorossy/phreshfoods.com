// js/mapLogic.js

// Global map variables, initialized in initAppMap
let map;
let geocoder;
let placesService; // ADDED: For Google Places API
let infowindow;    // ADDED: For displaying info bubbles

// Ensure these are accessible if used by showInfoWindowForShop
// These would typically be populated in main.js or apiService.js
// let allButcherShops = []; // Example, ensure this is populated with your shop data
// let currentlyDisplayedShops = []; // Example

function initAppMap() { // This is the callback for Google Maps API
    console.log("initAppMap called");

    map = new google.maps.Map(document.getElementById("map"), {
        center: DEFAULT_MAP_CENTER, // Assuming DEFAULT_MAP_CENTER is defined
        zoom: DEFAULT_MAP_ZOOM,     // Assuming DEFAULT_MAP_ZOOM is defined
        mapTypeControl: false,
        styles: mapStyles.maineLicensePlate, // mapStyles from config.js
        gestureHandling: 'greedy',
        // --- HIDE CAMERA CONTROLS ---
        zoomControl: false,            // Hides the zoom +/- buttons
        streetViewControl: false,      // Hides the Pegman (Street View)
        fullscreenControl: false,      // Hides the fullscreen button
        rotateControl: false,          // Hides the rotation control (compass)
        scaleControl: false            // Ensures map scale is not shown (usually false by default anyway)
        // --- END OF HIDE CAMERA CONTROLS ---
    });
    
    geocoder = new google.maps.Geocoder();
    placesService = new google.maps.places.PlacesService(map); // Initialized here
    infowindow = new google.maps.InfoWindow();                // Initialized here
    console.log("InfoWindow initialized in initAppMap:", infowindow);

    if (map) {
        map.addListener('click', () => {
            if (markerClickedRecently) { // markerClickedRecently from main.js
                console.log("Map click ignored due to recent marker click.");
                return;
            }
            // Close infowindow on map click if it's not a marker click
            if (infowindow) {
                infowindow.close();
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
            // Ensure allButcherShops and currentlyDisplayedShops are defined and accessible
            if (currentMapCenter && ((typeof currentlyDisplayedShops !== 'undefined' && currentlyDisplayedShops.length > 0) || (typeof allButcherShops !== 'undefined' && allButcherShops.length > 0))) {
                let shopsToSort = (typeof currentlyDisplayedShops !== 'undefined' && currentlyDisplayedShops.length > 0) ? [...currentlyDisplayedShops] : [...allButcherShops];
                if (typeof searchInput !== 'undefined' && searchInput && searchInput.value.trim() !== '' && shopsToSort.length === allButcherShops.length) {
                     const searchTerm = searchInput.value.toLowerCase().trim();
                     shopsToSort = allButcherShops.filter(shop =>
                        shop.Name.toLowerCase().includes(searchTerm) ||
                        (shop.City && shop.City.toLowerCase().includes(searchTerm)) ||
                        (shop.Address && shop.Address.toLowerCase().includes(searchTerm)) // Added check for shop.Address
                    );
                }
                if (typeof renderListings === 'function') {
                    renderListings(shopsToSort, true, currentMapCenter); // from uiLogic.js
                }
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
        if (typeof processAndPlotShops === 'function') {
            processAndPlotShops(); // from main.js
        }
    });
    if (map.getBounds()) map.setCenter(getAdjustedMapCenter(center)); else map.setCenter(center);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                console.log("User location obtained:", userLocation);
                if (map) {
                     new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        title: "Your Location",
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 7,
                            fillColor: "#4285F4",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "white"
                        }
                     });
                    map.setZoom(DEFAULT_ZOOM); // Assuming DEFAULT_ZOOM is defined
                    map.setCenter(getAdjustedMapCenter(userLocation));
                    google.maps.event.addListenerOnce(map, 'idle', () => {
                        if (typeof renderListings === 'function' && typeof allButcherShops !== 'undefined' && typeof currentlyDisplayedShops !== 'undefined') {
                            renderListings(currentlyDisplayedShops.length ? currentlyDisplayedShops : allButcherShops, true, map.getCenter());
                        }
                        if (typeof processAndPlotShops === 'function') { // Re-process if needed, or adjust logic
                           processAndPlotShops();
                        }
                    });
                }
            },
            (error) => {
                console.warn(`Geolocation Error: ${error.message}. Using default location.`);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
        );
    }
}


function plotMarkers(shopsToPlot) {
    if (typeof allButcherShops === 'undefined') {
        console.error("allButcherShops is not defined in plotMarkers scope.");
        return;
    }
    allButcherShops.forEach(s => { if (s.marker) s.marker.setMap(null); });

    shopsToPlot.forEach(shop => {
        if (shop.lat && shop.lng) {
            createMarkerForShop(shop);
        } else if (shop.GoogleProfileID) {
            // Use global placesService
            if (!placesService) { console.error("PlacesService not initialized."); return; }
            placesService.getDetails({ placeId: shop.GoogleProfileID, fields: ['geometry'] }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    shop.lat = place.geometry.location.lat(); shop.lng = place.geometry.location.lng();
                    createMarkerForShop(shop); // Call after getting lat/lng
                } else if (shop.Address && shop.Address !== 'N/A') {
                    geocodeAddressFallback(shop);
                } else {
                    console.warn(`Could not get geometry for ${shop.Name} (ID: ${shop.GoogleProfileID}) and no address fallback.`);
                }
            });
            // Removed createMarkerForShop(shop) from here; it should be in the callback or after geocodeAddressFallback
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

// js/mapLogic.js

function createMarkerForShop(shop) {
    if (shop.marker) shop.marker.setMap(null);
    if (shop.lat === undefined || shop.lng === undefined) {
        return;
    }
    const iconConfig = { path: google.maps.SymbolPath.CIRCLE, fillColor: (typeof markerColor !== 'undefined' ? markerColor : '#FF0000'), fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 1.5, scale: 8 };
    shop.marker = new google.maps.Marker({ position: { lat: shop.lat, lng: shop.lng }, map, title: shop.Name, icon: iconConfig });

    shop.marker.addListener('click', () => {
        console.log(`MAPLOGIC: Marker clicked for shop: ${shop.Name}`);
        if (typeof markerClickedRecently !== 'undefined') markerClickedRecently = true;

        // 1. Open overlays (this will populate them too)
        if (typeof openClickedShopOverlays === 'function') {
            openClickedShopOverlays(shop); // Pass the full shop object
        } else {
            console.warn("MAPLOGIC: openClickedShopOverlays function is not defined.");
        }

        // 2. Show InfoWindow (this will pan the map *after* overlays are open)
        // Use a slight delay to ensure DOM has updated from overlay opening and CSS transitions.
        setTimeout(() => {
            console.log(`MAPLOGIC: Delayed action for marker click - showing infowindow for ${shop.Name}`);
            if (shop.GoogleProfileID) {
                if (typeof showInfoWindowForShop === 'function') {
                    showInfoWindowForShop(shop.GoogleProfileID); // This function in mapLogic.js will handle panning
                } else {
                    console.error("MAPLOGIC: showInfoWindowForShop function is not defined.");
                }
            } else {
                // Handle case where there's no GoogleProfileID but we still want to pan and maybe show basic info
                console.warn(`MAPLOGIC: No GoogleProfileID for marker click on "${shop.Name}". Panning to lat/lng.`);
                if (infowindow) infowindow.close(); // Close any existing infowindow

                if (shop.lat && shop.lng && typeof map !== 'undefined' && map && typeof getAdjustedMapCenter === 'function') {
                    map.panTo(getAdjustedMapCenter({ lat: shop.lat, lng: shop.lng }));
                    // Optionally, open a very basic infowindow here
                    let basicContent = `<strong>${shop.Name}</strong>`;
                    if(shop.Address) basicContent += `<br>${shop.Address}`;
                    infowindow.setContent(basicContent);
                    infowindow.open(map, shop.marker); // Open on the marker
                }
            }
        }, 100); // 100ms delay. Adjust if transitions are longer or if offset is still off.

        if (typeof markerClickedRecently !== 'undefined') {
            setTimeout(() => { markerClickedRecently = false; }, 150); // Slightly longer than the action delay
        }
    });
}
// js/mapLogic.js

function showInfoWindowForShop(shopId) {
    console.log(`MAPLOGIC: showInfoWindowForShop called for shopId: ${shopId}`);
    if (!shopId) {
        console.error("MAPLOGIC: showInfoWindowForShop called without a shopId.");
        return;
    }
    if (typeof allButcherShops === 'undefined' || !allButcherShops) {
        console.error("MAPLOGIC: allButcherShops is not available in showInfoWindowForShop.");
        return;
    }

    const shop = allButcherShops.find(s => s.GoogleProfileID === shopId);

    if (!shop) {
        console.error(`MAPLOGIC: Shop with ID "${shopId}" not found in allButcherShops.`);
        return;
    }

    // Determine the position to pan to and for infowindow anchor
    const positionForMap = shop.marker ? shop.marker.getPosition() : (shop.lat && shop.lng ? { lat: shop.lat, lng: shop.lng } : null);

    if (!positionForMap) {
        console.warn(`MAPLOGIC: No valid position (marker or lat/lng) for shop "${shop.Name}". Cannot pan or show infowindow effectively.`);
        return;
    }
    
    // Pan the map, assuming overlays are now in their correct state
    if (map) {
        console.log("MAPLOGIC (showInfoWindowForShop): Panning map to target.");
        const adjustedCenter = getAdjustedMapCenter(positionForMap);
        map.panTo(adjustedCenter);
        // map.setZoom(DESIRED_ZOOM_LEVEL); // Optionally set zoom
    } else {
        console.warn("MAPLOGIC: Map object not available for panning in showInfoWindowForShop.");
    }

    if (infowindow) {
        infowindow.close();
    } else {
        infowindow = new google.maps.InfoWindow();
        console.log("MAPLOGIC: New InfoWindow instance created in showInfoWindowForShop.");
    }

    // Fetch Place Details if not already fetched, or if you want to always refresh
    // For simplicity, let's assume we always fetch here, or you can check if shop.placeDetails exists
    if (shop.GoogleProfileID && placesService) {
        const request = {
            placeId: shop.GoogleProfileID,
            fields: ['name', 'formatted_address', 'website', 'opening_hours', 'rating',
                     'user_ratings_total', 'photos', 'formatted_phone_number', 'url',
                     'icon', 'business_status', 'reviews'] // Ensure 'reviews' is requested
        };
        console.log(`MAPLOGIC: Requesting Place Details for ${shop.Name}`);
        placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                console.log(`MAPLOGIC: Place Details received for ${shop.Name}`, place);
                shop.placeDetails = place; // Store/update details on the shop object

                // Update overlays again if they are open, as we now have fresh place.reviews
                // This is important if reviews are primarily from Google
                if (typeof detailsOverlayShopElement !== 'undefined' && detailsOverlayShopElement.classList.contains('is-open')) {
                     const reviewsContainer = document.getElementById('shopReviewsContainer');
                     if(reviewsContainer && place.reviews) {
                         displayShopReviews(place, reviewsContainer); // displayShopReviews expects object with .reviews
                     }
                }


                let contentString = `<div style="max-width: 320px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">`;
                contentString += `<h4 style="margin-top:0; margin-bottom: 10px; font-size: 18px; color: #333;">${place.name || shop.Name}</h4>`;
                if (place.business_status) contentString += `<p style="margin-bottom:5px; font-weight: bold; color: ${place.business_status === 'OPERATIONAL' ? 'green' : 'red'};">Status: ${place.business_status.replace(/_/g, ' ')}</p>`;
                if (place.formatted_address) contentString += `<p style="margin-bottom:5px;"><strong>Address:</strong> ${place.formatted_address}</p>`;
                if (place.rating) contentString += `<p style="margin-bottom:5px;"><strong>Rating:</strong> ${place.rating} / 5 (${place.user_ratings_total || 0} reviews)</p>`;
                if (place.formatted_phone_number) contentString += `<p style="margin-bottom:5px;"><strong>Phone:</strong> <a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a></p>`;
                if (place.website) {
                    let simpleDomain = place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                    contentString += `<p style="margin-bottom:5px;"><strong>Website:</strong> <a href="${place.website}" target="_blank" rel="noopener noreferrer">${simpleDomain}</a></p>`;
                }
                if (place.opening_hours) contentString += `<p style="margin-bottom:5px;"><strong>Status:</strong> ${place.opening_hours.isOpen() ? 'Open now' : 'Closed'}</p>`;
                if (place.url) contentString += `<p style="margin-bottom:0; margin-top:10px;"><a href="${place.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 12px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 4px;">View on Google Maps</a></p>`;
                contentString += `</div>`;
                
                infowindow.setContent(contentString);
                infowindow.open(map, shop.marker); // Anchor to marker
            } else {
                console.warn(`MAPLOGIC: Place details request failed for ${shop.Name} (ID: ${shop.GoogleProfileID}): ${status}`);
                // Show basic info if details fail
                let basicContent = `<strong>${shop.Name}</strong>`;
                if (shop.Address) basicContent += `<br>${shop.Address}`;
                basicContent += `<br><em style="font-size:0.9em; color:#555;">More details not available. Error: ${status}</em>`;
                infowindow.setContent(basicContent);
                infowindow.open(map, shop.marker);
            }
        });
    } else { // No GoogleProfileID, show basic info
        console.log(`MAPLOGIC: No GoogleProfileID for ${shop.Name}, showing basic infowindow.`);
        let contentString = `<div style="max-width: 250px; font-family: Arial, sans-serif;"><strong>${shop.Name}</strong>`;
        if (shop.Address && shop.Address !== 'N/A') contentString += `<br>${shop.Address}`;
        contentString += `<br><em style="font-size:0.9em; color: #555;">Basic information.</em></div>`;
        infowindow.setContent(contentString);
        if (shop.marker) { // Prefer marker if it exists
            infowindow.open(map, shop.marker);
        } else if (positionForMap) { // Fallback to position if no marker but lat/lng exist
             infowindow.setPosition(positionForMap); // Set position if no anchor
             infowindow.open(map);
        }
    }
    // console.log(`MAPLOGIC: InfoWindow process initiated for shop "${shop.Name}"`);
}


// getAdjustedMapCenter function remains the same as your provided version, or my slightly revised one.
function getAdjustedMapCenter(targetCenterInput) {
    if (!map || !map.getDiv()) {
        // console.log("ADJUST_MAP: Map or mapDiv not ready.");
        return targetCenterInput;
    }
    let targetLat, targetLng;
    if (typeof targetCenterInput.lat === 'function') {
        targetLat = targetCenterInput.lat();
        targetLng = targetCenterInput.lng();
    } else {
        targetLat = targetCenterInput.lat;
        targetLng = targetCenterInput.lng;
    }
     if (targetLat === undefined || targetLng === undefined) {
        console.error("ADJUST_MAP: Invalid targetCenter:", targetCenterInput);
        return map.getCenter();
    }

    const mapDiv = map.getDiv(); const mapWidth = mapDiv.offsetWidth;
    let panelLeftWidth = 0; let panelRightWidth = 0;

    if (typeof detailsOverlaySocialElement !== 'undefined' && detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open')) {
        panelLeftWidth = detailsOverlaySocialElement.offsetWidth;
    }
    if (typeof detailsOverlayShopElement !== 'undefined' && detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open')) {
        panelRightWidth = detailsOverlayShopElement.offsetWidth;
    } else if (typeof listingsPanelElement !== 'undefined' && listingsPanelElement && getComputedStyle(listingsPanelElement).display !== 'none' && listingsPanelElement.offsetWidth > 0) {
        panelRightWidth = listingsPanelElement.offsetWidth;
    }

    // console.log(`ADJUST_MAP: mapWidth=${mapWidth}, panelLeftWidth=${panelLeftWidth}, panelRightWidth=${panelRightWidth}`);

    if ((panelLeftWidth <= 0 && panelRightWidth <= 0) || mapWidth <= 0) {
        return { lat: targetLat, lng: targetLng };
    }
    const bounds = map.getBounds(); if (!bounds) { return { lat: targetLat, lng: targetLng };}

    const spanLng = bounds.toSpan().lng();
    const occlusionRatio = (panelRightWidth - panelLeftWidth) / mapWidth;
    const lngOffset = spanLng * (occlusionRatio / 2);

    return { lat: targetLat, lng: targetLng + lngOffset };
}