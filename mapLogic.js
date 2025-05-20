// js/mapLogic.js

// Global map variables, initialized in initAppMap
let map;
// let geocoder; // window.geocoder is used
let placesService; // For Google Places API
let infowindow;    // For displaying info bubbles
let directionsService;    // NEW
let directionsRenderer;   // NEW
let currentUserLocation = null; // To store user's fetched location (currently not auto-fetching)
let autocomplete; // For Google Places Autocomplete on searchInput

// This will store the full Google Place object from the last autocomplete selection
window.lastPlaceSelectedByAutocomplete = null;



function initAppMap() {
    console.log("initAppMap called");

    map = new google.maps.Map(document.getElementById("map"), {
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        mapTypeControl: false,
        styles: mapStyles.maineLicensePlate, // Make sure mapStyles is defined (e.g., from config.js)
        gestureHandling: 'greedy',
        zoomControl: false, // Usually good to have zoom control
        streetViewControl: false,
        fullscreenControl: false,
        rotateControl: false,
        scaleControl: false // Scale control can be useful
    });
    
    window.geocoder = new google.maps.Geocoder(); // Make it global for access in main.js
    placesService = new google.maps.places.PlacesService(map);
    infowindow = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0, -15) // Adjust if needed for marker icon (common for circle markers)
    });
    // console.log("InfoWindow initialized in initAppMap:", infowindow);

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    const directionsPanelDiv = document.getElementById('directionsPanel');
    if (directionsPanelDiv) {
        directionsRenderer.setPanel(directionsPanelDiv);
    } else {
        console.warn("Directions panel div ('directionsPanel') not found for textual directions.");
    }

    const searchInputElement = document.getElementById('searchInput'); // Get searchInput here
    if (searchInputElement) {
        const maineBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(42.975426, -71.089859), // SW corner of Maine
            new google.maps.LatLng(47.459683, -66.949829)  // NE corner of Maine
        );

        autocomplete = new google.maps.places.Autocomplete(searchInputElement, {
            bounds: maineBounds,
            strictBounds: false, // False allows results outside bounds but biased towards them
            componentRestrictions: { country: "us" }, // Restrict to USA
            fields: ["name", "formatted_address", "geometry", "address_components", "place_id", "types"]
        });

        autocomplete.addListener('place_changed', () => {
            window.lastPlaceSelectedByAutocomplete = null; // Clear previous selection *first*

            const place = autocomplete.getPlace();

            if (!place || !place.geometry || !place.geometry.location) {
                // console.warn("Autocomplete: Place selection is invalid or has no geometry. Input:", searchInputElement.value);
                if (place && place.name) searchInputElement.value = place.name;
                else if (place && place.formatted_address) searchInputElement.value = place.formatted_address;
                
                if (typeof handleSearch === 'function') {
                    //  console.log("Autocomplete: place_changed with invalid place, calling handleSearch.");
                     handleSearch();
                }
                return;
            }

            window.lastPlaceSelectedByAutocomplete = place; 
            searchInputElement.value = place.name || place.formatted_address || searchInputElement.value;

            if (place.geometry.viewport) {
                map.fitBounds(getAdjustedBounds(place.geometry.viewport)); // Adjust viewport as well
            } else {
                map.setCenter(getAdjustedMapCenter(place.geometry.location));
                const placeIsSpecific = place.types && (place.types.includes('establishment') || place.types.includes('point_of_interest') || place.types.includes('premise') || place.types.includes('street_address'));
                map.setZoom(placeIsSpecific ? 15 : 12); 
            }

            if (typeof handleSearch === 'function') {
                // console.log("Autocomplete: place_changed with valid place, calling handleSearch.");
                handleSearch();
            }
        });
    } else {
        console.warn("searchInput element not found for Autocomplete initialization.");
    }
    
    if (map) {
        map.addListener('click', (e) => {
            if (e.placeId) e.stop(); 
            if (markerClickedRecently) return;
            
            if (infowindow) infowindow.close();
            
            const rightIsOpen = typeof detailsOverlayShopElement !== 'undefined' && detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open');
            const leftIsOpen = typeof detailsOverlaySocialElement !== 'undefined' && detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open');
            if (rightIsOpen || leftIsOpen) {
                if (typeof closeClickedShopOverlays === 'function') closeClickedShopOverlays(); 
            }
        });

        map.addListener('idle', () => {
            const currentMapCenter = map.getCenter();
            if (currentMapCenter && typeof currentlyDisplayedShops !== 'undefined' && currentlyDisplayedShops && typeof renderListings === 'function') {
                 // Sort only if no specific autocomplete place is defining the current view's center
                if (!window.lastPlaceSelectedByAutocomplete || (window.lastPlaceSelectedByAutocomplete && !window.lastPlaceSelectedByAutocomplete.geometry)) {
                    renderListings(currentlyDisplayedShops, true, currentMapCenter);
                }
            }
        });
    }

    if (typeof processAndPlotShops === 'function') {
        // console.log("Map initialized, calling processAndPlotShops.");
        // Set initial center considering potential overlays (though unlikely on first load)
        map.setCenter(getAdjustedMapCenter(DEFAULT_MAP_CENTER));
        processAndPlotShops();
    } else {
        console.error("processAndPlotShops function not found.");
    }
}


function calculateAndDisplayRoute(destination) {
    if (!directionsService || !directionsRenderer) {
        console.error("Directions service or renderer not initialized.");
        alert("Directions service is not ready.");
        return;
    }
    if (!destination) {
        console.error("Directions: Destination not provided.");
        alert("No destination provided for directions.");
        return;
    }
    directionsRenderer.setDirections({routes: []}); 
    const directionsPanelDiv = document.getElementById('directionsPanel');
    if (directionsPanelDiv) directionsPanelDiv.innerHTML = ""; 

    let origin;
    const searchInputElement = document.getElementById('searchInput');
    if (window.lastPlaceSelectedByAutocomplete && window.lastPlaceSelectedByAutocomplete.geometry && window.lastPlaceSelectedByAutocomplete.geometry.location) {
        origin = window.lastPlaceSelectedByAutocomplete.geometry.location;
        // console.log("Directions: Using current autocomplete selection as origin:", origin.toString());
    } else if (searchInputElement && searchInputElement.value.trim() !== "") {
        origin = searchInputElement.value.trim();
        // console.log("Directions: Using text from search bar as origin:", origin);
    } else {
        const fallbackOrigin = prompt("Please enter your starting address for directions (e.g., '123 Main St, Anytown' or 'City, State'):", `${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.lng}`);
        if (!fallbackOrigin) {
            alert("Starting location is required for directions.");
            return;
        }
        origin = fallbackOrigin;
        // console.log("Directions: Using user-prompted origin:", origin);
    }

    let destinationArg;
    if (destination.lat && destination.lng) {
        destinationArg = { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) };
    } else if (destination.GoogleProfileID) {
        destinationArg = { placeId: destination.GoogleProfileID };
    } else if (destination.Address && destination.Address !== 'N/A') {
        destinationArg = destination.Address;
    } else {
        alert("Cannot determine destination for directions for " + (destination.Name || "the selected shop") + ".");
        return;
    }

    // console.log("Directions: Requesting route from", origin, "to", destinationArg);

    directionsService.route(
        {
            origin: origin,
            destination: destinationArg,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                // console.log("Directions: Route found.", response);
                directionsRenderer.setDirections(response);
                document.getElementById('clearShopDirectionsButton')?.classList.remove('hidden');
                document.getElementById('getShopDirectionsButton')?.classList.add('hidden');
                // Pan the map to show the start of the route, adjusted for panels
                if (response.routes && response.routes[0] && response.routes[0].legs && response.routes[0].legs[0]) {
                    map.panTo(getAdjustedMapCenter(response.routes[0].legs[0].start_location));
                    // Optionally fit bounds of the route, also adjusted
                    // map.fitBounds(getAdjustedBounds(response.routes[0].bounds));
                }
            } else {
                window.alert("Directions request failed: " + status + ".\nThis could be due to an invalid start/end location or no drivable route between them.");
                console.error("Directions request failed:", status, response);
            }
        }
    );
}

function clearDirections() {
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
    }
    const directionsPanelDiv = document.getElementById('directionsPanel');
    if (directionsPanelDiv) {
        directionsPanelDiv.innerHTML = "";
    }
    document.getElementById('clearShopDirectionsButton')?.classList.add('hidden');
    document.getElementById('getShopDirectionsButton')?.classList.remove('hidden');
    // console.log("Directions cleared.");
}

function plotMarkers(shopsToPlot) {
    if (typeof allFarmStands !== 'undefined' && allFarmStands) {
        allFarmStands.forEach(s => {
            if (s.marker) {
                s.marker.setMap(null);
            }
        });
    }

    shopsToPlot.forEach(shop => {
        if (shop.lat !== undefined && shop.lng !== undefined && shop.lat !== null && shop.lng !== null) {
            createMarkerForShop(shop);
        } else {
            // console.warn(`Shop "${shop.Name}" is missing lat/lng. Cannot plot marker.`);
        }
    });
}

function createMarkerForShop(shop) {
    if (shop.lat === undefined || shop.lng === undefined || shop.lat === null || shop.lng === null) {
        // console.warn(`createMarkerForShop: Shop ${shop.Name} missing valid lat/lng.`);
        return; 
    }
    const lat = parseFloat(shop.lat);
    const lng = parseFloat(shop.lng);
    if (isNaN(lat) || isNaN(lng)) {
        // console.warn(`createMarkerForShop: Shop ${shop.Name} has invalid lat/lng after parse: ${shop.lat}, ${shop.lng}`);
        return;
    }

    const iconConfig = { path: google.maps.SymbolPath.CIRCLE, fillColor: (typeof markerColor !== 'undefined' ? markerColor : '#FF0000'), fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 1.5, scale: 8 };
    
    shop.marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map, 
        title: shop.Name,
        icon: iconConfig,
        zIndex: 1 // Default zIndex for regular markers
    });

    shop.marker.addListener('click', () => {
        // console.log(`MAPLOGIC: Marker clicked for shop: ${shop.Name}`);
        markerClickedRecently = true; 
        if (shop.marker) shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1); // Bring to front

        if (typeof openClickedShopOverlays === 'function') {
            openClickedShopOverlays(shop); 
        } else {
            console.warn("MAPLOGIC: openClickedShopOverlays function is not defined in uiLogic.js.");
        }
        
        setTimeout(() => {
            if (typeof showInfoWindowForShop === 'function') {
                showInfoWindowForShop(shop); 
            } else {
                console.error("MAPLOGIC: showInfoWindowForShop function is not defined.");
            }
        }, 50); // Reduced delay slightly, ensure overlays have time to start opening.

        setTimeout(() => { markerClickedRecently = false; }, 300);
    });
}

function showInfoWindowForShop(shop) { 
    if (!shop) {
        console.error("MAPLOGIC: showInfoWindowForShop called with no shop object.");
        return;
    }
    // console.log(`MAPLOGIC: showInfoWindowForShop called for shop: ${shop.Name}`);

    const positionForMap = shop.marker ? shop.marker.getPosition() : (shop.lat && shop.lng ? { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng) } : null);

    if (!positionForMap) {
        // console.warn(`MAPLOGIC: No valid map position for shop "${shop.Name}".`);
        if (infowindow) infowindow.close(); 
        return;
    }
    
    if (map) {
        const adjustedCenter = getAdjustedMapCenter(positionForMap);
        map.panTo(adjustedCenter);
        // console.log(`MAPLOGIC: Panned to adjusted center for ${shop.Name}:`, adjustedCenter);
    }

    if (!infowindow) { 
        infowindow = new google.maps.InfoWindow({pixelOffset: new google.maps.Size(0, -15)});
        // console.warn("MAPLOGIC: InfoWindow was not initialized, created new instance.");
    }
    infowindow.close(); 

    // Reset zIndex of other markers if one was brought to front
    if (typeof allFarmStands !== 'undefined') {
        allFarmStands.forEach(s => {
            if (s.marker && s !== shop) s.marker.setZIndex(1);
        });
    }
    if (shop.marker) shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);


    if (shop.GoogleProfileID && placesService) {
        const request = {
            placeId: shop.GoogleProfileID,
            fields: ['name', 'formatted_address', 'website', 'opening_hours', 'rating',
                     'user_ratings_total', 'photos', 'formatted_phone_number', 'url',
                     'icon', 'business_status', 'reviews', 'geometry' 
                    ]
        };
        placesService.getDetails(request, (place, status) => {
            let contentString = `<div style="max-width: 320px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">`;
            contentString += `<h4 style="margin-top:0; margin-bottom: 10px; font-size: 18px; color: #333;">${shop.Name}</h4>`; 

            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                shop.placeDetails = place; 

                const ratingCardDivId = `rating-for-${shop.GoogleProfileID || (shop.Name + (shop.Address || '')).replace(/[^a-zA-Z0-9]/g, '-')}`;
                const ratingCardDiv = document.getElementById(ratingCardDivId);
                if (ratingCardDiv && typeof getStarRatingHTML === 'function') {
                    ratingCardDiv.innerHTML = getStarRatingHTML(place.rating, place.user_ratings_total);
                }
                if (typeof detailsOverlayShopElement !== 'undefined' && detailsOverlayShopElement.classList.contains('is-open') && shopDetailNameElement.textContent === shop.Name) {
                     const reviewsContainer = document.getElementById('shopReviewsContainer');
                     if(reviewsContainer && typeof displayShopReviews === 'function') { 
                         if (place.reviews && place.reviews.length > 0) {
                            displayShopReviews(place, reviewsContainer);
                         } else {
                            reviewsContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Google reviews available.</p>';
                         }
                     }
                }

                if (place.name && place.name !== shop.Name) contentString += `<p style="margin-bottom:5px; font-size:0.9em; color:#555;">(Google Maps: ${place.name})</p>`;
                if (place.business_status) contentString += `<p style="margin-bottom:5px; font-weight: bold; color: ${place.business_status === 'OPERATIONAL' ? 'green' : 'red'};">Status: ${place.business_status.replace(/_/g, ' ')}</p>`;
                if (place.formatted_address) contentString += `<p style="margin-bottom:5px;"><strong>Address:</strong> ${place.formatted_address}</p>`;
                if (place.rating !== undefined) contentString += `<p style="margin-bottom:5px;"><strong>Rating:</strong> ${place.rating} / 5 (${place.user_ratings_total || 0} reviews)</p>`;
                else if (shop.Rating && shop.Rating !== "N/A") contentString += `<p style="margin-bottom:5px;"><strong>Rating (CSV):</strong> ${shop.Rating}</p>`;
                if (place.formatted_phone_number) contentString += `<p style="margin-bottom:5px;"><strong>Phone:</strong> <a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a></p>`;
                else if (shop.Phone) contentString += `<p style="margin-bottom:5px;"><strong>Phone (CSV):</strong> <a href="tel:${shop.Phone}">${shop.Phone}</a></p>`;
                
                if (place.website) {
                    let simpleDomain = place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                    if (simpleDomain.length > 30) simpleDomain = simpleDomain.substring(0,27) + "...";
                    contentString += `<p style="margin-bottom:5px;"><strong>Website:</strong> <a href="${place.website}" target="_blank" rel="noopener noreferrer">${simpleDomain}</a></p>`;
                } else if (shop.Website) {
                    let simpleDomain = shop.Website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                     if (simpleDomain.length > 30) simpleDomain = simpleDomain.substring(0,27) + "...";
                    contentString += `<p style="margin-bottom:5px;"><strong>Website (CSV):</strong> <a href="${shop.Website.startsWith('http') ? shop.Website : `http://${shop.Website}`}" target="_blank" rel="noopener noreferrer">${simpleDomain}</a></p>`;
                }

                if (place.opening_hours && typeof place.opening_hours.isOpen === 'function') {
                    contentString += `<p style="margin-bottom:5px;"><strong>Now:</strong> ${place.opening_hours.isOpen() ? '<span style="color:green;">Open</span>' : '<span style="color:red;">Closed</span>'}</p>`;
                }
                if (place.url) contentString += `<p style="margin-bottom:0; margin-top:10px;"><a href="${place.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 12px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 4px;">View on Google Maps</a></p>`;
                
            } else {
                if (shop.Address && shop.Address !== "N/A") contentString += `<p style="margin-bottom:5px;"><strong>Address:</strong> ${shop.Address}</p>`;
                if (shop.Phone) contentString += `<p style="margin-bottom:5px;"><strong>Phone:</strong> <a href="tel:${shop.Phone}">${shop.Phone}</a></p>`;
                if (shop.Website) {
                    let simpleDomain = shop.Website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                     if (simpleDomain.length > 30) simpleDomain = simpleDomain.substring(0,27) + "...";
                    contentString += `<p style="margin-bottom:5px;"><strong>Website:</strong> <a href="${shop.Website.startsWith('http') ? shop.Website : `http://${shop.Website}`}" target="_blank" rel="noopener noreferrer">${simpleDomain}</a></p>`;
                }
                contentString += `<br><em style="font-size:0.9em; color:#777;">More details not available via Google. (Error: ${status})</em>`;
            }
            contentString += `</div>`;
            infowindow.setContent(contentString);
            infowindow.open({ anchor: shop.marker || undefined, map: map, shouldFocus: false });
            if (!shop.marker) infowindow.setPosition(positionForMap);


        });
    } else {
        let contentString = `<div style="max-width: 280px; font-family: Arial, sans-serif;font-size: 14px;line-height: 1.5;"><strong>${shop.Name}</strong>`;
        if (shop.Address && shop.Address !== 'N/A') contentString += `<br>${shop.Address}`;
        if (shop.Phone) contentString += `<br>Phone: <a href="tel:${shop.Phone}">${shop.Phone}</a>`;
        if (shop.Website) {
            let simpleDomain = shop.Website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
            if (simpleDomain.length > 30) simpleDomain = simpleDomain.substring(0,27) + "...";
            contentString += `<br>Website: <a href="${shop.Website.startsWith('http') ? shop.Website : `http://${shop.Website}`}" target="_blank">${simpleDomain}</a>`;
        }
        contentString += `<br><em style="font-size:0.9em; color: #555;">Basic information (from local data).</em></div>`;
        infowindow.setContent(contentString);
        infowindow.open({ anchor: shop.marker || undefined, map: map, shouldFocus: false });
        if (!shop.marker) infowindow.setPosition(positionForMap);
    }
}









// js/mapLogic.js

// ... (other global variables and functions remain the same) ...
// Ensure markerClickedRecently is declared ONCE at the top of this file:
// let markerClickedRecently = false;


// ALTERNATIVE getAdjustedMapCenter
function getAdjustedMapCenter(targetCenterInput) {
    if (!map || !map.getDiv() || !map.getBounds() || !map.getProjection()) {
        // console.warn("AdjustMap: Map not fully ready (div, bounds, or projection missing).");
        return targetCenterInput; // Return original if map components aren't ready
    }

    let targetLat, targetLng;
    if (targetCenterInput && typeof targetCenterInput.lat === 'function' && typeof targetCenterInput.lng === 'function') {
        targetLat = targetCenterInput.lat();
        targetLng = targetCenterInput.lng();
    } else if (targetCenterInput && typeof targetCenterInput.lat === 'number' && typeof targetCenterInput.lng === 'number') {
        targetLat = targetCenterInput.lat;
        targetLng = targetCenterInput.lng;
    } else {
        // console.error("AdjustMap: Invalid targetCenterInput. Using current map center.", targetCenterInput);
        const currentCenter = map.getCenter();
        // Fallback if even currentCenter is not available (highly unlikely if map is ready)
        if (!currentCenter) return { lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng }; 
        return { lat: currentCenter.lat(), lng: currentCenter.lng() };
    }

    const mapDiv = map.getDiv();
    const mapWidthPx = mapDiv.offsetWidth; // Width of the map container in pixels
    let panelLeftWidthPx = 0;
    let panelRightWidthPx = 0;

    // Explicitly get global elements (assuming they are set on window object from other files)
    const socialOverlay = window.detailsOverlaySocialElement;
    const shopOverlay = window.detailsOverlayShopElement;
    const listingsPanel = window.listingsPanelElement;

    if (socialOverlay && socialOverlay.classList.contains('is-open') && getComputedStyle(socialOverlay).display !== 'none') {
        panelLeftWidthPx = socialOverlay.offsetWidth;
    }

    if (shopOverlay && shopOverlay.classList.contains('is-open') && getComputedStyle(shopOverlay).display !== 'none') {
        panelRightWidthPx = shopOverlay.offsetWidth;
    } else if (listingsPanel && getComputedStyle(listingsPanel).display !== 'none' && listingsPanel.offsetWidth > 0 && window.innerWidth >= 768) {
        panelRightWidthPx = listingsPanel.offsetWidth;
    }
    
    if ((panelLeftWidthPx <= 0 && panelRightWidthPx <= 0) || mapWidthPx <= 0) {
        // console.log("AdjustMap: No active panels occluding or map width is zero. No offset.");
        return { lat: targetLat, lng: targetLng }; 
    }

    // Calculate the net horizontal shift in pixels needed for the map's content.
    // If right panel is open, content needs to shift left (negative pixel shift for content).
    // If left panel is open, content needs to shift right (positive pixel shift for content).
    // The center of the *visible* map area is what we are targeting.
    // This `netPixelShiftForCenter` is how many pixels the target LatLng needs to move on screen
    // from the geometric center of the map div to be in the center of the visible area.
    const netPixelShiftForCenter = (panelLeftWidthPx - panelRightWidthPx) / 2;

    // Get the map's current bounds and projection
    const bounds = map.getBounds();
    if (!bounds) { // Should have been caught by the initial check, but good to be safe
        // console.warn("AdjustMap: Map bounds became unavailable.");
        return { lat: targetLat, lng: targetLng };
    }

    // Calculate degrees per pixel
    // Horizontal distance in degrees covered by the map
    const lngSpanDegrees = bounds.toSpan().lng(); 
    // Degrees per pixel = total degrees / total pixels
    const degreesPerPixelLng = lngSpanDegrees / mapWidthPx; 

    // Convert the pixel shift to a longitude degree shift
    const lngOffsetDegrees = netPixelShiftForCenter * degreesPerPixelLng;

    const adjustedLng = targetLng - lngOffsetDegrees; // Subtract because a positive netPixelShiftForCenter means target is to the right of visible center

    // console.log(`AdjustMap ----`);
    // console.log(`  Target LatLng: ${targetLat.toFixed(5)}, ${targetLng.toFixed(5)}`);
    // console.log(`  Map Width (px): ${mapWidthPx}`);
    // console.log(`  Panel Left (px): ${panelLeftWidthPx}, Panel Right (px): ${panelRightWidthPx}`);
    // console.log(`  Net Pixel Shift for Center Point: ${netPixelShiftForCenter.toFixed(2)}px`);
    // console.log(`  Lng Span (deg): ${lngSpanDegrees.toFixed(5)}`);
    // console.log(`  Degrees/Pixel Lng: ${degreesPerPixelLng.toExponential(3)}`);
    // console.log(`  Lng Offset (deg): ${lngOffsetDegrees.toFixed(5)}`);
    // console.log(`  Adjusted Lng: ${adjustedLng.toFixed(5)}`);
    // console.log(`----`);


    return { lat: targetLat, lng: adjustedLng };
}

// ... (rest of mapLogic.js, ensure initAppMap, showInfoWindowForShop, etc., call this getAdjustedMapCenter) ...

// Make sure elements from other files are explicitly accessed via window if they are true globals
// Example (in mapLogic.js where these elements are used, e.g. getAdjustedMapCenter):
// const socialOverlay = window.detailsOverlaySocialElement;
// const shopOverlay = window.detailsOverlayShopElement;
// const listingsPanel = window.listingsPanelElement;
// This ensures mapLogic.js is looking for them on the window object where uiLogic.js/main.js might have put them.
// If they are not on window, you'd need to pass them or use a shared state manager.





















// Helper to adjust bounds, similar to getAdjustedMapCenter
function getAdjustedBounds(originalBounds) {
    if (!map || !map.getDiv() || !originalBounds) {
        return originalBounds;
    }

    const mapDiv = map.getDiv();
    const mapWidth = mapDiv.offsetWidth;
    let panelLeftWidth = 0;
    let panelRightWidth = 0;

    if (typeof detailsOverlaySocialElement !== 'undefined' && detailsOverlaySocialElement &&
        detailsOverlaySocialElement.classList.contains('is-open') && getComputedStyle(detailsOverlaySocialElement).display !== 'none') {
        panelLeftWidth = detailsOverlaySocialElement.offsetWidth;
    }

    if (typeof detailsOverlayShopElement !== 'undefined' && detailsOverlayShopElement &&
        detailsOverlayShopElement.classList.contains('is-open') && getComputedStyle(detailsOverlayShopElement).display !== 'none') {
        panelRightWidth = detailsOverlayShopElement.offsetWidth;
    } else if (typeof listingsPanelElement !== 'undefined' && listingsPanelElement &&
               getComputedStyle(listingsPanelElement).display !== 'none' && listingsPanelElement.offsetWidth > 0 &&
               window.innerWidth >= 768) {
        panelRightWidth = listingsPanelElement.offsetWidth;
    }

    if ((panelLeftWidth <= 0 && panelRightWidth <= 0) || mapWidth <= 0) {
        return originalBounds;
    }
    
    const mapProjection = map.getProjection();
    const currentZoom = map.getZoom(); // Or calculate effective zoom for bounds

    if (!mapProjection || typeof currentZoom === 'undefined') {
        return originalBounds;
    }

    const sw = originalBounds.getSouthWest();
    const ne = originalBounds.getNorthEast();

    const swPoint = mapProjection.fromLatLngToPoint(sw);
    const nePoint = mapProjection.fromLatLngToPoint(ne);

    // Calculate how much the bounds need to shift in world coordinates
    // If right panel is open, the visible area is shifted left. We need to expand the bounds to the right.
    // If left panel is open, visible area shifted right. Expand bounds to the left.
    const worldOffsetX = (panelRightWidth - panelLeftWidth) / (2 * Math.pow(2, currentZoom));


    const newSwPoint = new google.maps.Point(swPoint.x - worldOffsetX, swPoint.y);
    const newNePoint = new google.maps.Point(nePoint.x - worldOffsetX, nePoint.y);
    
    const newSw = mapProjection.fromPointToLatLng(newSwPoint);
    const newNe = mapProjection.fromPointToLatLng(newNePoint);

    if (newSw && newNe) {
        // console.log("AdjustBounds: Applied offset for panels.");
        return new google.maps.LatLngBounds(newSw, newNe);
    }
    return originalBounds;
}