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

function getAdjustedMapCenter(targetCenterInput) {
    if (!map || !map.getDiv()) return targetCenterInput;

    let targetLat, targetLng;
    if (typeof targetCenterInput.lat === 'function') {
        targetLat = targetCenterInput.lat();
        targetLng = targetCenterInput.lng();
    } else {
        targetLat = targetCenterInput.lat;
        targetLng = targetCenterInput.lng;
    }
     if (targetLat === undefined || targetLng === undefined) {
        console.error("Invalid targetCenter for getAdjustedMapCenter:", targetCenterInput);
        return map.getCenter();
    }

    const mapDiv = map.getDiv(); const mapWidth = mapDiv.offsetWidth;
    let panelLeftWidth = 0; let panelRightWidth = 0;

    // Ensure these overlay elements are defined or checks are robust
    if (typeof detailsOverlaySocialElement !== 'undefined' && detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open')) panelLeftWidth = detailsOverlaySocialElement.offsetWidth;
    if (typeof detailsOverlayShopElement !== 'undefined' && detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open')) panelRightWidth = detailsOverlayShopElement.offsetWidth;
    else if (typeof listingsPanelElement !== 'undefined' && listingsPanelElement && getComputedStyle(listingsPanelElement).display !== 'none') panelRightWidth = listingsPanelElement.offsetWidth;

    if ((panelLeftWidth <= 0 && panelRightWidth <= 0) || mapWidth <= 0) return { lat: targetLat, lng: targetLng };
    const bounds = map.getBounds(); if (!bounds) return { lat: targetLat, lng: targetLng };

    const spanLng = bounds.toSpan().lng();
    const occlusionRatio = (panelRightWidth - panelLeftWidth) / mapWidth;
    const lngOffset = spanLng * (occlusionRatio / 2);

    return { lat: targetLat, lng: targetLng + lngOffset };
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

function createMarkerForShop(shop) {
    if (shop.marker) shop.marker.setMap(null);
    if (shop.lat === undefined || shop.lng === undefined) {
        // console.warn("Attempted to create marker for shop without lat/lng:", shop.Name);
        return;
    }
    // Ensure markerColor is defined
    const iconConfig = { path: google.maps.SymbolPath.CIRCLE, fillColor: (typeof markerColor !== 'undefined' ? markerColor : '#FF0000'), fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 1.5, scale: 8 };
    shop.marker = new google.maps.Marker({ position: { lat: shop.lat, lng: shop.lng }, map, title: shop.Name, icon: iconConfig });

    shop.marker.addListener('click', () => {
        if (typeof markerClickedRecently !== 'undefined') markerClickedRecently = true;
// 1. Open overlays (this will populate them too)
        if (typeof openClickedShopOverlays === 'function') {
            openClickedShopOverlays(shop);
        }

        // 2. Show InfoWindow (this will pan the map *after* overlays are open)
        // Use a slight delay to ensure DOM has updated from openClickedShopOverlays
        setTimeout(() => {
            if (shop.GoogleProfileID) {
                showInfoWindowForShop(shop.GoogleProfileID);
            } else {
                // Handle case where there's no GoogleProfileID but we still want to pan and maybe show basic info
                if (infowindow) infowindow.close();
                map.panTo(getAdjustedMapCenter({ lat: shop.lat, lng: shop.lng }));
                // Potentially open a simpler infowindow here if needed
            }
        }, 50); // Small delay for DOM updates from overlay opening

        if (typeof markerClickedRecently !== 'undefined') {
            setTimeout(() => { markerClickedRecently = false; }, 100);
        }
    });

        if (shop.GoogleProfileID && placesService) {
            const request = {
                placeId: shop.GoogleProfileID,
                fields: ['name', 'formatted_address', 'website', 'opening_hours', 'rating', 'user_ratings_total', 'photos', 'formatted_phone_number', 'url', 'icon', 'business_status']
            };

            placesService.getDetails(request, (place, status) => {
                let contentString = '';
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    contentString = `<div style="max-width: 320px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">`;
                    contentString += `<h4 style="margin-top:0; margin-bottom: 10px; font-size: 18px; color: #333;">${place.name || shop.Name}</h4>`;
                    // if (place.photos && place.photos.length > 0) { // Photo logic was commented out in your provided code
                    //     const photoUrl = place.photos[0].getUrl({'maxWidth': 320, 'maxHeight': 160});
                    //     contentString += `<img src="${photoUrl}" alt="${place.name || shop.Name}" style="width:100%; height:auto; margin-bottom:10px; border-radius: 4px; border: 1px solid #eee;"><br>`;
                    // }
                    if (place.business_status) {
                         contentString += `<p style="margin-bottom:5px; font-weight: bold; color: ${place.business_status === 'OPERATIONAL' ? 'green' : 'red'};">Status: ${place.business_status.replace(/_/g, ' ')}</p>`;
                    }
                    if (place.formatted_address) {
                        contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-map-marker-alt"></i> Address:</strong> ${place.formatted_address}</p>`;
                    }
                    if (place.rating) {
                        contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-star"></i> Rating:</strong> ${place.rating} / 5 (${place.user_ratings_total || 0} reviews)</p>`;
                    }
                    if (place.formatted_phone_number) {
                        contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-phone"></i> Phone:</strong> <a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a></p>`;
                    }
                    if (place.website) {
                        let simpleDomain = place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                        contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-globe"></i> Website:</strong> <a href="${place.website}" target="_blank" rel="noopener noreferrer">${simpleDomain}</a></p>`;
                    }
                    if (place.opening_hours) {
                        contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-clock"></i> Status:</strong> ${place.opening_hours.isOpen() ? 'Open now' : 'Closed'}</p>`;
                    }
                    if (place.url) {
                        contentString += `<p style="margin-bottom:0; margin-top:10px;"><a href="${place.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 12px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 4px;">View on Google Maps</a></p>`;
                    }
                    contentString += `</div>`;
                } else {
                    contentString = `<div style="max-width: 250px; font-family: Arial, sans-serif;"><strong>${shop.Name}</strong>`;
                    if (shop.Address && shop.Address !== 'N/A') contentString += `<br>${shop.Address}`;
                    contentString += `<br><em style="font-size:0.9em; color: #555;">More details not available.`;
                    if (status !== google.maps.places.PlacesServiceStatus.OK && status !== "ZERO_RESULTS") {
                         contentString += `<br>Error: ${status}`;
                    }
                    contentString += `</em></div>`;
                    console.warn(`Place details request failed for ${shop.Name} (ID: ${shop.GoogleProfileID}): ${status}`);
                }
                infowindow.setContent(contentString);
                infowindow.open(map, shop.marker);
            });
        } else {
            let contentString = `<div style="max-width: 250px; font-family: Arial, sans-serif;"><strong>${shop.Name}</strong>`;
            if (shop.Address && shop.Address !== 'N/A') contentString += `<br>${shop.Address}`;
            contentString += `<br><em style="font-size:0.9em; color: #555;">No Google Profile ID available for more details.</em></div>`;
            infowindow.setContent(contentString);
            infowindow.open(map, shop.marker);
        }

        if (typeof openClickedShopOverlays === 'function') {
            openClickedShopOverlays(shop); // from uiLogic.js
        }
        if (typeof markerClickedRecently !== 'undefined') {
            setTimeout(() => { markerClickedRecently = false; }, 100);
        }
    });
}

// --- NEW FUNCTION TO SHOW INFOWINDOW FROM LISTING CLICK ---
function showInfoWindowForShop(shopId) {
    if (!shopId) {
        console.error("showInfoWindowForShop called without a shopId.");
        return;
    }
    if (typeof allButcherShops === 'undefined' || !allButcherShops) {
        console.error("allButcherShops is not available in showInfoWindowForShop.");
        return;
    }

    const shop = allButcherShops.find(s => s.GoogleProfileID === shopId);

    if (!shop) {
        console.error(`Shop with ID "${shopId}" not found in allButcherShops.`);
        return;
    }

    if (!shop.marker) {
        console.warn(`Marker not found for shop "${shop.Name}". The shop might not have been plotted or its coordinates are missing.`);
        if (shop.lat && shop.lng && map) {
            map.panTo({ lat: shop.lat, lng: shop.lng });
            map.setZoom(15);
        }
        // Optionally, you could try to fetch details and show infowindow at lat/lng if marker is missing but placeId exists
        // For now, we assume marker is necessary to attach infowindow.
        return;
    }

    if (infowindow) {
        infowindow.close();
    } else {
        console.warn("Infowindow not available in showInfoWindowForShop. Initializing.");
        infowindow = new google.maps.InfoWindow(); // Defensive initialization
    }

    if (map && shop.marker.getPosition()) { // Check if map and marker position are valid
        map.panTo(shop.marker.getPosition());
        // map.setZoom(16); // Optional: zoom in
    } else {
        console.warn("Map or marker position not available for panning in showInfoWindowForShop.");
    }


    if (shop.GoogleProfileID && placesService) {
        const request = {
            placeId: shop.GoogleProfileID,
            fields: ['name', 'formatted_address', 'website', 'opening_hours', 'rating', 'user_ratings_total', 'photos', 'formatted_phone_number', 'url', 'icon', 'business_status']
        };

        placesService.getDetails(request, (place, status) => {
            let contentString = '';
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                contentString = `<div style="max-width: 320px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">`;
                contentString += `<h4 style="margin-top:0; margin-bottom: 10px; font-size: 18px; color: #333;">${place.name || shop.Name}</h4>`;
                // if (place.photos && place.photos.length > 0) { // Photo logic was commented out
                //     const photoUrl = place.photos[0].getUrl({'maxWidth': 320, 'maxHeight': 160});
                //     contentString += `<img src="${photoUrl}" alt="${place.name || shop.Name}" style="width:100%; height:auto; margin-bottom:10px; border-radius: 4px; border: 1px solid #eee;"><br>`;
                // }
                if (place.business_status) {
                     contentString += `<p style="margin-bottom:5px; font-weight: bold; color: ${place.business_status === 'OPERATIONAL' ? 'green' : 'red'};">Status: ${place.business_status.replace(/_/g, ' ')}</p>`;
                }
                if (place.formatted_address) {
                    contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-map-marker-alt"></i> Address:</strong> ${place.formatted_address}</p>`;
                }
                if (place.rating) {
                    contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-star"></i> Rating:</strong> ${place.rating} / 5 (${place.user_ratings_total || 0} reviews)</p>`;
                }
                if (place.formatted_phone_number) {
                    contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-phone"></i> Phone:</strong> <a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a></p>`;
                }
                if (place.website) {
                    let simpleDomain = place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                    contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-globe"></i> Website:</strong> <a href="${place.website}" target="_blank" rel="noopener noreferrer">${simpleDomain}</a></p>`;
                }
                if (place.opening_hours) {
                    contentString += `<p style="margin-bottom:5px;"><strong><i class="fas fa-clock"></i> Status:</strong> ${place.opening_hours.isOpen() ? 'Open now' : 'Closed'}</p>`;
                }
                if (place.url) {
                    contentString += `<p style="margin-bottom:0; margin-top:10px;"><a href="${place.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 12px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 4px;">View on Google Maps</a></p>`;
                }
                contentString += `</div>`;
            } else {
                contentString = `<div style="max-width: 250px; font-family: Arial, sans-serif;"><strong>${shop.Name}</strong>`;
                if (shop.Address && shop.Address !== 'N/A') contentString += `<br>${shop.Address}`;
                contentString += `<br><em style="font-size:0.9em; color: #555;">More details not available.`;
                if (status !== google.maps.places.PlacesServiceStatus.OK && status !== "ZERO_RESULTS") {
                     contentString += `<br>Error: ${status}`;
                }
                contentString += `</em></div>`;
                console.warn(`Place details request failed for ${shop.Name} (ID: ${shop.GoogleProfileID}) when clicking listing: ${status}`);
            }
            infowindow.setContent(contentString);
            infowindow.open(map, shop.marker); // Open on the shop's marker
        });
    } else {
        let contentString = `<div style="max-width: 250px; font-family: Arial, sans-serif;"><strong>${shop.Name}</strong>`;
        if (shop.Address && shop.Address !== 'N/A') contentString += `<br>${shop.Address}`;
        contentString += `<br><em style="font-size:0.9em; color: #555;">No Google Profile ID available for full details.</em></div>`;
        infowindow.setContent(contentString);
        infowindow.open(map, shop.marker); // Open on the shop's marker
    }
    console.log(`Infowindow opened for shop "${shop.Name}" from listing click.`);
}