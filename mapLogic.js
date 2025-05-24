// js/mapLogic.js

// Global map variables, initialized in initAppMap
let map;
// let geocoder; // window.geocoder is used
let placesService; // For Google Places API
let infowindow; // For displaying info bubbles
let directionsService; // NEW
let directionsRenderer; // NEW
let currentUserLocation = null; // To store user's fetched location (currently not auto-fetching)
let autocomplete; // For Google Places Autocomplete on searchInput

// This will store the full Google Place object from the last autocomplete selection
window.lastPlaceSelectedByAutocomplete = null;

const MAINE_BOUNDS_LITERAL = {
  sw: { lat: 42.975426, lng: -71.089859 },
  ne: { lat: 47.459683, lng: -66.949829 },
};

function initAppMap() {
  console.log("initAppMap called");

  map = new google.maps.Map(document.getElementById("map"), {
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    mapTypeControl: false,
    styles: mapStyles.maineLicensePlate, // Make sure mapStyles is defined (e.g., from config.js)
    gestureHandling: "greedy",
    zoomControl: false, // Usually good to have zoom control
    streetViewControl: false,
    fullscreenControl: false,
    rotateControl: false,
    scaleControl: false, // Scale control can be useful
  });

  window.geocoder = new google.maps.Geocoder(); // Make it global for access in main.js
  placesService = new google.maps.places.PlacesService(map);
  infowindow = new google.maps.InfoWindow({
    pixelOffset: new google.maps.Size(0, -15), // Adjust if needed for marker icon (common for circle markers)
  });
  // console.log("InfoWindow initialized in initAppMap:", infowindow);

  // ---- START OF NEW CODE ----
// Listen for the 'domready' event on the infowindow
google.maps.event.addListener(infowindow, 'domready', () => {
    // The InfoWindow's DOM is now ready.
    // Find the container for the tail and close button.
    // Note: Google's internal class names can change, but '.gm-style-iw-chr'
    // has been relatively stable for the tail/close button container.
    const tailAndCloseContainer = document.querySelector('.gm-style-iw-chr');

    if (tailAndCloseContainer) {
        // Remove the element from the DOM
        tailAndCloseContainer.remove();
        console.log("Removed .gm-style-iw-chr element from InfoWindow DOM.");
    } else {
        // This might happen if Google changes their class names significantly
        // or if the selector is too broad and picks up something else first.
        // For more robustness, you might try to find it relative to the infowindow's main content
        // but that's more complex.
        // console.warn("Could not find .gm-style-iw-chr to remove from InfoWindow DOM.");
    }

    // Optional: If you previously had CSS to hide the close button itself,
    // you might also want to remove any explicit height/width it might have caused on its parent,
    // though removing .gm-style-iw-chr usually handles this.
    // For example, if the button itself was '.gm-ui-hover-effect':
    // const closeButtonDirect = document.querySelector('.gm-style-iw-c .gm-ui-hover-effect');
    // if (closeButtonDirect) {
    //    closeButtonDirect.remove();
    // }
});
// ---- END OF NEW CODE ----

  directionsService = new google.maps.DirectionsService();
  // --- CONFIGURE DirectionsRenderer HERE ---
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map, // Associate the renderer with your map
    polylineOptions: {
      strokeColor: "#FF0000", // Red color for the route line
      strokeOpacity: 0.8, // Optional: Adjust opacity (0.0 to 1.0)
      strokeWeight: 6, // Optional: Adjust line thickness
    },
    // Optional: If you want to hide the default A/B markers
    // suppressMarkers: true
  });
  // --- END OF DirectionsRenderer CONFIGURATION ---
  directionsRenderer.setMap(map);
  const directionsPanelDiv = document.getElementById("directionsPanel");
  if (directionsPanelDiv) {
    directionsRenderer.setPanel(directionsPanelDiv);
  } else {
    console.warn(
      "Directions panel div ('directionsPanel') not found for textual directions."
    );
  }

  const searchInputElement = document.getElementById("searchInput"); // Get searchInput here
  if (searchInputElement) {
    const maineAutocompleteBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(
        MAINE_BOUNDS_LITERAL.sw.lat,
        MAINE_BOUNDS_LITERAL.sw.lng
      ),
      new google.maps.LatLng(
        MAINE_BOUNDS_LITERAL.ne.lat,
        MAINE_BOUNDS_LITERAL.ne.lng
      )
    );

    autocomplete = new google.maps.places.Autocomplete(searchInputElement, {
      bounds: maineAutocompleteBounds, // Bias results to Maine's geographical area
      strictBounds: true, // IMPORTANT: Restrict results ONLY to within these bounds
      componentRestrictions: { country: "us" }, // Keep restriction to US
      fields: [
        "name",
        "formatted_address",
        "geometry",
        "address_components",
        "place_id",
        "types",
      ],
      // Optional: Add types to further refine, e.g., ['address'] or ['geocode']
      // types: ['address'] // This would prefer full street addresses
    });

    autocomplete.addListener("place_changed", () => {
      window.lastPlaceSelectedByAutocomplete = null; // Clear previous selection *first*

      const place = autocomplete.getPlace();

      if (!place || !place.geometry || !place.geometry.location) {
        // console.warn("Autocomplete: Place selection is invalid or has no geometry. Input:", searchInputElement.value);
        if (place && place.name) searchInputElement.value = place.name;
        else if (place && place.formatted_address)
          searchInputElement.value = place.formatted_address;

        if (typeof handleSearch === "function") {
          //  console.log("Autocomplete: place_changed with invalid place, calling handleSearch.");
          handleSearch();
        }
        return;
      }

      // --- MODIFIED LOGIC TO REMOVE COUNTRY ---
      if (place.formatted_address) {
        let displayAddress = place.formatted_address;

        // Attempt to remove the country part.
        // This assumes the country is the last component, often preceded by ", ".
        // For US addresses, this is usually ", USA".
        // Since componentRestrictions is { country: "us" }, we can be fairly certain about "USA".

        const countryString = ", USA"; // Or a more generic regex if dealing with multiple countries
        // but since you restrict to US, this is simpler.
        if (displayAddress.endsWith(countryString)) {
          displayAddress = displayAddress.substring(
            0,
            displayAddress.length - countryString.length
          );
        } else {
          // Fallback: More general attempt to remove the last ", Country Name" part
          // This is more fragile as country names vary.
          // We can use address_components for a more robust solution if needed.
          const addressParts = displayAddress.split(", ");
          if (addressParts.length > 1) {
            // Check if the last part is likely a country by checking address_components
            let isCountryLast = false;
            if (place.address_components) {
              const lastComponent =
                place.address_components[place.address_components.length - 1];
              if (lastComponent && lastComponent.types.includes("country")) {
                // Check if the last part of formatted_address matches this country name
                if (displayAddress.endsWith(lastComponent.long_name)) {
                  displayAddress = displayAddress
                    .substring(
                      0,
                      displayAddress.length - lastComponent.long_name.length
                    )
                    .replace(/,\s*$/, ""); // Remove trailing comma and space
                  isCountryLast = true;
                } else if (displayAddress.endsWith(lastComponent.short_name)) {
                  displayAddress = displayAddress
                    .substring(
                      0,
                      displayAddress.length - lastComponent.short_name.length
                    )
                    .replace(/,\s*$/, "");
                  isCountryLast = true;
                }
              }
            }
            // If not identified as country via address_components, or if you prefer a simpler cut:
            // This simpler cut might remove a state if the address is short.
            // if (!isCountryLast && addressParts.length > 2) { // Only if there are at least 3 parts (e.g., City, State, Country)
            //    addressParts.pop(); // Remove the last part
            //    displayAddress = addressParts.join(', ');
            // }
          }
        }
        // Ensure no trailing comma or whitespace is left
        displayAddress = displayAddress.replace(/,\s*$/, "").trim();

        searchInputElement.value = displayAddress;
      } else {
        // Fallback if formatted_address is somehow missing
        searchInputElement.value = place.name || searchInputElement.value;
      }
      // --- END OF MODIFIED LOGIC ---
      window.lastPlaceSelectedByAutocomplete = place;




            // --- ADJUSTED ZOOM LOGIC ---
      // --- CONSOLIDATED AND CORRECTED MAP VIEW LOGIC ---
      map.setCenter(getAdjustedMapCenter(place.geometry.location)); // Always set the adjusted center first

      const isVerySpecificPlace = place.types && (
          place.types.includes("street_address") ||
          place.types.includes("premise")
          // Consider if you want 'establishment' or 'point_of_interest' to also use default zoom
          // || place.types.includes("establishment")
          // || place.types.includes("point_of_interest")
      );

      if (place.geometry.viewport && !isVerySpecificPlace) {
        // If it has a viewport AND it's NOT a very specific address (e.g., city, state), fit to adjusted bounds.
        // This will naturally set an appropriate zoom level for the viewport.
        console.log("Autocomplete: Fitting to viewport for non-specific place.");
        map.fitBounds(getAdjustedBounds(place.geometry.viewport));
      } else {
        // For very specific addresses (street_address, premise) OR if no viewport,
        // just use the centered map and set a predefined zoom level.
        // This prevents over-zooming on street addresses.
        console.log("Autocomplete: Setting default zoom for specific place or no viewport.");
        map.setZoom(DEFAULT_MAP_ZOOM); // Use your desired default zoom (e.g., 10, 12, or 14)
      }
      // --- END CONSOLIDATED MAP VIEW LOGIC ---



      // --- APPLY ADJUSTED CENTERING/BOUNDS ---
      if (place.geometry.viewport) {
        // Use getAdjustedBounds for viewport
        map.fitBounds(getAdjustedBounds(place.geometry.viewport));
      } else {
        // Use getAdjustedMapCenter for a single point
        map.setCenter(getAdjustedMapCenter(place.geometry.location));
        const placeIsSpecific =
          place.types &&
          (place.types.includes("establishment") ||
            place.types.includes("point_of_interest") ||
            place.types.includes("premise") ||
            place.types.includes("street_address"));
        map.setZoom(placeIsSpecific ? USER_LOCATION_MAP_ZOOM : DEFAULT_MAP_ZOOM); // Use defined zoom levels
      }
      // --- END APPLY ADJUSTED CENTERING/BOUNDS ---

      if (typeof handleSearch === "function") {
        // console.log("Autocomplete: place_changed with valid place, calling handleSearch.");
        handleSearch();
      }
    });
  } else {
    console.warn(
      "searchInput element not found for Autocomplete initialization."
    );
  }

  if (map) {
    map.addListener("click", (e) => {
      if (e.placeId) e.stop();
      if (markerClickedRecently) return;

      if (infowindow) infowindow.close();

      const rightIsOpen =
        typeof detailsOverlayShopElement !== "undefined" &&
        detailsOverlayShopElement &&
        detailsOverlayShopElement.classList.contains("is-open");
      const leftIsOpen =
        typeof detailsOverlaySocialElement !== "undefined" &&
        detailsOverlaySocialElement &&
        detailsOverlaySocialElement.classList.contains("is-open");
      if (rightIsOpen || leftIsOpen) {
        if (typeof closeClickedShopOverlays === "function")
          closeClickedShopOverlays();
      }
    });

    map.addListener("idle", () => {
      const currentMapCenter = map.getCenter();
      if (
        currentMapCenter &&
        typeof currentlyDisplayedShops !== "undefined" &&
        currentlyDisplayedShops &&
        typeof renderListings === "function"
      ) {
        // Sort only if no specific autocomplete place is defining the current view's center
        if (
          !window.lastPlaceSelectedByAutocomplete ||
          (window.lastPlaceSelectedByAutocomplete &&
            !window.lastPlaceSelectedByAutocomplete.geometry)
        ) {
          renderListings(currentlyDisplayedShops, true, currentMapCenter);
        }
      }
    });
  }

  if (typeof processAndPlotShops === "function") {
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
  directionsRenderer.setDirections({ routes: [] });
  const directionsPanelDiv = document.getElementById("directionsPanel");
  if (directionsPanelDiv) directionsPanelDiv.innerHTML = "";

  let origin;
  const searchInputElement = document.getElementById("searchInput");
  if (
    window.lastPlaceSelectedByAutocomplete &&
    window.lastPlaceSelectedByAutocomplete.geometry &&
    window.lastPlaceSelectedByAutocomplete.geometry.location
  ) {
    origin = window.lastPlaceSelectedByAutocomplete.geometry.location;
    // console.log("Directions: Using current autocomplete selection as origin:", origin.toString());
  } else if (searchInputElement && searchInputElement.value.trim() !== "") {
    origin = searchInputElement.value.trim();
    // console.log("Directions: Using text from search bar as origin:", origin);
  } else {
    const fallbackOrigin = prompt(
      "Please enter your starting address for directions (e.g., '123 Main St, Anytown' or 'City, State'):",
      `${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.lng}`
    );
    if (!fallbackOrigin) {
      alert("Starting location is required for directions.");
      return;
    }
    origin = fallbackOrigin;
    // console.log("Directions: Using user-prompted origin:", origin);
  }

  let destinationArg;
  if (destination.lat && destination.lng) {
    destinationArg = {
      lat: parseFloat(destination.lat),
      lng: parseFloat(destination.lng),
    };
  } else if (destination.GoogleProfileID) {
    destinationArg = { placeId: destination.GoogleProfileID };
  } else if (destination.Address && destination.Address !== "N/A") {
    destinationArg = destination.Address;
  } else {
    alert(
      "Cannot determine destination for directions for " +
        (destination.Name || "the selected shop") +
        "."
    );
    return;
  }

  // console.log("Directions: Requesting route from", origin, "to", destinationArg);

  directionsService.route(
    {
      origin: origin,
      destination: destinationArg,
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (response, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        // console.log("Directions: Route found.", response);
        directionsRenderer.setDirections(response);
        document
          .getElementById("clearShopDirectionsButton")
          ?.classList.remove("hidden");
        document
          .getElementById("getShopDirectionsButton")
          ?.classList.add("hidden");
        // Pan the map to show the start of the route, adjusted for panels
        if (
          response.routes &&
          response.routes[0] &&
          response.routes[0].legs &&
          response.routes[0].legs[0]
        ) {
          map.panTo(
            getAdjustedMapCenter(response.routes[0].legs[0].start_location)
          );
          // Optionally fit bounds of the route, also adjusted
          // map.fitBounds(getAdjustedBounds(response.routes[0].bounds));
        }
      } else {
        window.alert(
          "Directions request failed: " +
            status +
            ".\nThis could be due to an invalid start/end location or no drivable route between them."
        );
        console.error("Directions request failed:", status, response);
      }
    }
  );
}

function clearDirections() {
  if (directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] });
  }
  const directionsPanelDiv = document.getElementById("directionsPanel");
  if (directionsPanelDiv) {
    directionsPanelDiv.innerHTML = "";
  }
  document.getElementById("clearShopDirectionsButton")?.classList.add("hidden");
  document
    .getElementById("getShopDirectionsButton")
    ?.classList.remove("hidden");
  // console.log("Directions cleared.");
}

function plotMarkers(shopsToPlot) {
  if (typeof allFarmStands !== "undefined" && allFarmStands) {
    allFarmStands.forEach((s) => {
      if (s.marker) {
        s.marker.setMap(null);
      }
    });
  }

  shopsToPlot.forEach((shop) => {
    if (
      shop.lat !== undefined &&
      shop.lng !== undefined &&
      shop.lat !== null &&
      shop.lng !== null
    ) {
      createMarkerForShop(shop);
    } else {
      // console.warn(`Shop "${shop.Name}" is missing lat/lng. Cannot plot marker.`);
    }
  });
}

function createMarkerForShop(shop) {
  if (
    shop.lat === undefined ||
    shop.lng === undefined ||
    shop.lat === null ||
    shop.lng === null
  ) {
    // console.warn(`createMarkerForShop: Shop ${shop.Name} missing valid lat/lng.`);
    return;
  }
  const lat = parseFloat(shop.lat);
  const lng = parseFloat(shop.lng);
  if (isNaN(lat) || isNaN(lng)) {
    // console.warn(`createMarkerForShop: Shop ${shop.Name} has invalid lat/lng after parse: ${shop.lat}, ${shop.lng}`);
    return;
  }

  const iconConfig = {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: typeof markerColor !== "undefined" ? markerColor : "#FF0000",
    fillOpacity: 0.9,
    strokeColor: "#ffffff",
    strokeWeight: 1.5,
    scale: 8,
  };

  shop.marker = new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map,
    title: shop.Name,
    icon: iconConfig,
    zIndex: 1, // Default zIndex for regular markers
  });

  shop.marker.addListener("click", () => {
    // console.log(`MAPLOGIC: Marker clicked for shop: ${shop.Name}`);
    markerClickedRecently = true;
    if (shop.marker) shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1); // Bring to front

    if (typeof openClickedShopOverlays === "function") {
      openClickedShopOverlays(shop);
    } else {
      console.warn(
        "MAPLOGIC: openClickedShopOverlays function is not defined in uiLogic.js."
      );
    }

    setTimeout(() => {
      if (typeof showInfoWindowForShop === "function") {
        showInfoWindowForShop(shop);
      } else {
        console.error(
          "MAPLOGIC: showInfoWindowForShop function is not defined."
        );
      }
    }, 50); // Reduced delay slightly, ensure overlays have time to start opening.

    setTimeout(() => {
      markerClickedRecently = false;
    }, 300);
  });
}

// js/mapLogic.js

// ... (imports, global variables, initAppMap, calculateAndDisplayRoute etc. remain the same) ...

function showInfoWindowForShop(shop) {
    if (!shop) {
        console.error("MAPLOGIC: showInfoWindowForShop called with no shop object.");
        return;
    }

    const positionForMap = shop.marker ? shop.marker.getPosition() : (shop.lat && shop.lng ? { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng) } : null);

    if (!positionForMap) {
        if (infowindow) infowindow.close();
        return;
    }
    
    if (map) {
        const adjustedCenter = getAdjustedMapCenter(positionForMap);
        map.panTo(adjustedCenter);
    }

    if (!infowindow) {
        infowindow = new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -15) });
    }
    infowindow.close();

    // Highlight current marker
    if (typeof allFarmStands !== 'undefined') {
        allFarmStands.forEach(s => { if (s.marker && s !== shop) s.marker.setZIndex(1); });
    }
    if (shop.marker) shop.marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);

    // Fetch fresh place details if GoogleProfileID exists (this also populates shop.placeDetails)
    // The generateShopContentHTML function will then use these fresh details.
    if (shop.GoogleProfileID && placesService) {
        const request = {
            placeId: shop.GoogleProfileID,
            fields: ['name', 'formatted_address', 'website', 'opening_hours', 'rating',
                     'user_ratings_total', 'photos', 'formatted_phone_number', 'url', // url for "View on Google Maps"
                     'icon', 'business_status', 'reviews', 'geometry']
        };
        placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                shop.placeDetails = place; // Update the shop object with fresh details
            } else {
                console.warn(`MAPLOGIC: Place details request failed for infowindow ${shop.Name} (ID: ${shop.GoogleProfileID}): ${status}. Using existing/CSV data.`);
            }
            // Whether details were fetched successfully or not, generate content with what we have
            const contentString = generateShopContentHTML(shop, 'infowindow');
            infowindow.setContent(contentString);
            infowindow.open({ anchor: shop.marker || undefined, map: map, shouldFocus: false });
            if (!shop.marker) infowindow.setPosition(positionForMap);
        });
    } else {
        // No GoogleProfileID, or placesService not available, generate content with existing shop data
        const contentString = generateShopContentHTML(shop, 'infowindow');
        infowindow.setContent(contentString);
        infowindow.open({ anchor: shop.marker || undefined, map: map, shouldFocus: false });
        if (!shop.marker) infowindow.setPosition(positionForMap);
    }
}








// js/mapLogic.js

// ... (Global map variables, initAppMap, etc. ... )

// ALTERNATIVE getAdjustedMapCenter
function getAdjustedMapCenter(targetCenterInput) {
  if (!map || !map.getDiv() || !map.getBounds() || !map.getProjection()) {
    return targetCenterInput;
  }

  let targetLat, targetLng;
  // ... (logic to get targetLat, targetLng from targetCenterInput - this part is fine)
  if (
    targetCenterInput &&
    typeof targetCenterInput.lat === "function" &&
    typeof targetCenterInput.lng === "function"
  ) {
    targetLat = targetCenterInput.lat();
    targetLng = targetCenterInput.lng();
  } else if (
    targetCenterInput &&
    typeof targetCenterInput.lat === "number" &&
    typeof targetCenterInput.lng === "number"
  ) {
    targetLat = targetCenterInput.lat;
    targetLng = targetCenterInput.lng;
  } else {
    const currentCenter = map.getCenter();
    if (!currentCenter) return { lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lng };
    return { lat: currentCenter.lat(), lng: currentCenter.lng() };
  }


  const mapDiv = map.getDiv();
  const mapWidthPx = mapDiv.offsetWidth;
  let panelLeftWidthPx = 0;
  let panelRightWidthPx = 0;

  // --- CORRECTED ACCESS TO GLOBAL DOM ELEMENTS ---
  const socialOverlay = window.detailsOverlaySocialElement; // Use window.
  const shopOverlay = window.detailsOverlayShopElement;     // Use window.
  const listingsPanel = window.listingsPanelElement;       // Use window.
  // --- END CORRECTION ---

  if (
    socialOverlay &&
    socialOverlay.classList.contains("is-open") &&
    getComputedStyle(socialOverlay).display !== "none"
  ) {
    panelLeftWidthPx = socialOverlay.offsetWidth;
  }

  if (
    shopOverlay &&
    shopOverlay.classList.contains("is-open") &&
    getComputedStyle(shopOverlay).display !== "none"
  ) {
    panelRightWidthPx = shopOverlay.offsetWidth;
  } else if (
    listingsPanel &&
    getComputedStyle(listingsPanel).display !== "none" &&
    listingsPanel.offsetWidth > 0 &&
    window.innerWidth >= 768 // Only consider listingsPanel on wider screens
  ) {
    panelRightWidthPx = listingsPanel.offsetWidth;
  }

  if ((panelLeftWidthPx <= 0 && panelRightWidthPx <= 0) || mapWidthPx <= 0) {
    return { lat: targetLat, lng: targetLng };
  }

  const netPixelShiftForCenter = (panelLeftWidthPx - panelRightWidthPx) / 2;
  const bounds = map.getBounds();
  if (!bounds) {
    return { lat: targetLat, lng: targetLng };
  }

  const lngSpanDegrees = bounds.toSpan().lng();
  const degreesPerPixelLng = lngSpanDegrees / mapWidthPx;
  const lngOffsetDegrees = netPixelShiftForCenter * degreesPerPixelLng;
  const adjustedLng = targetLng - lngOffsetDegrees;

  return { lat: targetLat, lng: adjustedLng };
}


function getAdjustedBounds(originalBounds) {
  if (!map || !map.getDiv() || !originalBounds) {
    return originalBounds;
  }

  const mapDiv = map.getDiv();
  const mapWidth = mapDiv.offsetWidth;
  let panelLeftWidth = 0;
  let panelRightWidth = 0;

  // --- CORRECTED ACCESS TO GLOBAL DOM ELEMENTS ---
  const socialOverlay = window.detailsOverlaySocialElement; // Use window.
  const shopOverlay = window.detailsOverlayShopElement;     // Use window.
  const listingsPanel = window.listingsPanelElement;       // Use window.
  // --- END CORRECTION ---

  if (
    socialOverlay && // Check if element exists
    socialOverlay.classList.contains("is-open") &&
    getComputedStyle(socialOverlay).display !== "none"
  ) {
    panelLeftWidth = socialOverlay.offsetWidth;
  }

  if (
    shopOverlay && // Check if element exists
    shopOverlay.classList.contains("is-open") &&
    getComputedStyle(shopOverlay).display !== "none"
  ) {
    panelRightWidth = shopOverlay.offsetWidth;
  } else if (
    listingsPanel && // Check if element exists
    getComputedStyle(listingsPanel).display !== "none" &&
    listingsPanel.offsetWidth > 0 &&
    window.innerWidth >= 768 // Only consider listingsPanel on wider screens
  ) {
    panelRightWidth = listingsPanel.offsetWidth;
  }

  if ((panelLeftWidth <= 0 && panelRightWidth <= 0) || mapWidth <= 0) {
    return originalBounds;
  }

  const mapProjection = map.getProjection();
  const currentZoom = map.getZoom();

  if (!mapProjection || typeof currentZoom === "undefined") {
    return originalBounds;
  }

  const sw = originalBounds.getSouthWest();
  const ne = originalBounds.getNorthEast();

  // Check if sw or ne are valid before proceeding
  if (!sw || !ne) {
      console.warn("AdjustBounds: originalBounds produced invalid sw or ne.");
      return originalBounds;
  }

  const swPoint = mapProjection.fromLatLngToPoint(sw);
  const nePoint = mapProjection.fromLatLngToPoint(ne);

  // Check if points are valid
  if (!swPoint || !nePoint) {
      console.warn("AdjustBounds: Projection returned invalid points from sw/ne.");
      return originalBounds;
  }

  const worldOffsetX = (panelRightWidth - panelLeftWidth) / (2 * Math.pow(2, currentZoom));

  const newSwPoint = new google.maps.Point(swPoint.x - worldOffsetX, swPoint.y);
  const newNePoint = new google.maps.Point(nePoint.x - worldOffsetX, nePoint.y);

  const newSw = mapProjection.fromPointToLatLng(newSwPoint);
  const newNe = mapProjection.fromPointToLatLng(newNePoint);

  if (newSw && newNe) {
    return new google.maps.LatLngBounds(newSw, newNe);
  }
  return originalBounds;
}

// ... (rest of mapLogic.js)