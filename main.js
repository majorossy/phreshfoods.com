// js/main.js

// --- Global State Variables ---
let allFarmStands = [];
let currentlyDisplayedShops = []; // Shops currently shown in the list (can be all or filtered)
let markerClickedRecently = false; // For map click vs marker click logic
let currentShopForDirections = null;
// Radius slider elements are now initialized in DOMContentLoaded
// let radiusSliderElement, radiusValueElement; // These will be initialized in DOMContentLoaded

// --- DOM Element Variables (to be initialized on DOMContentLoaded) ---
let listingsContainer,
  searchInput, // This specific variable 'searchInput' will be initialized
  noResultsDiv,
  listingsPanelElement,
  detailsOverlayShopElement,
  closeDetailsOverlayShopButton,
  shopDetailNameElement,
  // shopDetailRatingStarsElement, // Not used directly, handled in card
  // shopDetailAddressElement, // Not used directly
  // shopDetailDistanceElement, // Not used directly
  // shopDetailPhoneElement, // Not used directly
  // shopDetailWebsiteElement, // Not used directly
  // shopDetailMapLinkContainerElement, // Not used directly
  detailsOverlaySocialElement,
  // closeDetailsOverlaySocialButton, // Already handled by general overlay close
  socialLinksContainerElement,
  twitterTimelineContainerElement;

async function populateAllShopsWithLatLng(shops) {
  console.log("Populating Lat/Lng for all shops...");
  if (!placesService || !window.geocoder) {
    // Ensure google maps objects are available
    console.error(
      "PlacesService or Geocoder not initialized in mapLogic.js. Cannot populate Lat/Lng."
    );
    alert("Map services are not ready. Please refresh the page.");
    return;
  }

  const promises = shops.map(async (shop) => {
    if (shop.lat && shop.lng) return Promise.resolve(); // Already have lat/lng

    // Create a new promise for each shop's geocoding/place details lookup
    return new Promise((resolve) => {
      if (shop.GoogleProfileID) {
        placesService.getDetails(
          { placeId: shop.GoogleProfileID, fields: ["geometry"] },
          (place, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              place?.geometry?.location
            ) {
              shop.lat = place.geometry.location.lat();
              shop.lng = place.geometry.location.lng();
            } else {
              if (shop.Address && shop.Address !== "N/A") {
                window.geocoder.geocode(
                  { address: shop.Address + ", Maine, USA" }, // Added region biasing
                  (results, geoStatus) => {
                    if (geoStatus === "OK" && results[0]?.geometry) {
                      shop.lat = results[0].geometry.location.lat();
                      shop.lng = results[0].geometry.location.lng();
                    } else {
                      console.warn(
                        `Geocode fallback also failed for ${shop.Name}: ${geoStatus}`
                      );
                    }
                    resolve();
                  }
                );
                return;
              } else {
                console.warn(
                  `Could not get geometry for ${shop.Name} (ID: ${shop.GoogleProfileID}) and no address for fallback.`
                );
              }
            }
            resolve();
          }
        );
      } else if (shop.Address && shop.Address !== "N/A") {
        window.geocoder.geocode(
          { address: shop.Address + ", Maine, USA" }, // Added region biasing
          (results, geoStatus) => {
            if (geoStatus === "OK" && results[0]?.geometry) {
              shop.lat = results[0].geometry.location.lat();
              shop.lng = results[0].geometry.location.lng();
            } else {
              console.warn(
                `Geocode failed for ${shop.Name} (Address: ${shop.Address}): ${geoStatus}`
              );
            }
            resolve();
          }
        );
      } else {
        console.warn(
          `Cannot determine Lat/Lng for ${shop.Name}: No PlaceID or Address.`
        );
        resolve();
      }
    });
  });
  await Promise.all(promises);
  console.log("Finished populating Lat/Lng for all shops.");
}

async function processAndPlotShops() {
  console.log("processAndPlotShops called");
  if (listingsContainer)
    listingsContainer.innerHTML =
      '<p class="text-center text-gray-700 p-4 col-span-1 md:col-span-2">Loading farm stands...</p>';

  allFarmStands = await fetchSheetData();
  if (allFarmStands.length === 0) {
    if (noResultsDiv) {
      noResultsDiv.textContent =
        typeof GOOGLE_SHEET_DIRECT_URL !== "undefined" &&
        GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER
          ? "Data source not configured."
          : "No farm shops data found.";
      noResultsDiv.classList.remove("hidden");
    }
    if (listingsContainer) listingsContainer.classList.add("hidden");
    currentlyDisplayedShops = [];
    return;
  }

  await populateAllShopsWithLatLng(allFarmStands);
  currentlyDisplayedShops = [...allFarmStands];
  await handleSearch(); // Initial call
}

async function handleSearch() {
    console.log("handleSearch triggered.");
    let searchCenterLatLng = null;

    // Ensure searchInput is available by getting it directly from DOM
    const currentSearchInput = document.getElementById('searchInput');
    let selectedPlaceName = currentSearchInput ? currentSearchInput.value : "";

    if (
        window.lastPlaceSelectedByAutocomplete &&
        window.lastPlaceSelectedByAutocomplete.geometry &&
        window.lastPlaceSelectedByAutocomplete.geometry.location
    ) {
        searchCenterLatLng = window.lastPlaceSelectedByAutocomplete.geometry.location;
        selectedPlaceName =
        window.lastPlaceSelectedByAutocomplete.name ||
        window.lastPlaceSelectedByAutocomplete.formatted_address ||
        selectedPlaceName;
    } else {
        if (currentSearchInput && currentSearchInput.value.trim() !== "") {
            console.log(
                "No autocomplete selection, attempting to geocode search input for radius center:",
                currentSearchInput.value
            );
            try {
                const geocodeResults = await new Promise((resolve, reject) => {
                if (!window.geocoder) {
                    reject("Geocoder not available");
                    return;
                }
                window.geocoder.geocode(
                    { address: currentSearchInput.value.trim() + ", Maine, USA" }, // Region biasing
                    (results, status) => {
                    if (
                        status === google.maps.places.PlacesServiceStatus.OK &&
                        results &&
                        results[0] &&
                        results[0].geometry &&
                        results[0].geometry.location
                    ) {
                        resolve(results[0].geometry.location);
                    } else {
                        reject(status);
                    }
                    }
                );
                });
                searchCenterLatLng = geocodeResults;
                console.log("Geocoded search input to:", searchCenterLatLng.toString());
                if (map && !window.lastPlaceSelectedByAutocomplete) {
                    map.setCenter(getAdjustedMapCenter(searchCenterLatLng));
                    map.setZoom(10);
                }else {
                    map.setZoom(DEFAULT_MAP_ZOOM); // Use a default zoom for geocoded addresses
                }
            } catch (error) {
                console.warn(
                "Geocoding error for search input '" +
                    currentSearchInput.value.trim() +
                    "':",
                error
                );
            }
        }
    }

    let shopsToDisplay = [...allFarmStands];

    // --- NEW: Apply Product Attribute Filters ---
    const currentActiveProductFilters = window.activeProductFilters || {}; // Access from window
    const activeFilterKeys = Object.keys(currentActiveProductFilters).filter(key => currentActiveProductFilters[key]);

    if (activeFilterKeys.length > 0) {
        console.log("Applying product filters:", activeFilterKeys);
        shopsToDisplay = shopsToDisplay.filter(shop => {
            return activeFilterKeys.every(filterKey => {
                return shop[filterKey] === true; // shop.beef, shop.pork etc.
            });
        });
        console.log(`${shopsToDisplay.length} shops after product attribute filters.`);
    }
    // --- END NEW Product Attribute Filters ---

    // --- Existing Radius Filter (apply to the already product-filtered list) ---
    const currentRadiusSliderElement = document.getElementById('radiusSlider'); // Get fresh DOM ref
    const selectedRadiusMiles = currentRadiusSliderElement
        ? parseInt(currentRadiusSliderElement.value)
        : 30;

    if (searchCenterLatLng) {
        const radiusMeters = selectedRadiusMiles * 1609.344;
        console.log(
        `Filtering shops within ${selectedRadiusMiles} miles (${radiusMeters.toFixed(
            0
        )}m) of selected location.`
        );

        shopsToDisplay = shopsToDisplay.filter((shop) => {
            if (
                shop.lat === undefined ||
                shop.lng === undefined ||
                shop.lat === null ||
                shop.lng === null
            )
                return false;
            try {
                const shopLat = parseFloat(shop.lat);
                const shopLng = parseFloat(shop.lng);
                if (isNaN(shopLat) || isNaN(shopLng)) return false;
                const shopLocation = new google.maps.LatLng(shopLat, shopLng);
                const distanceInMeters =
                google.maps.geometry.spherical.computeDistanceBetween(
                    searchCenterLatLng,
                    shopLocation
                );
                return distanceInMeters <= radiusMeters;
            } catch (e) {
                console.error("Error calculating distance for shop:", shop.Name, e);
                return false;
            }
        });
        console.log(`${shopsToDisplay.length} shops found after radius filter.`);
    } else {
        console.log(
        "No search center determined for radius filter. Displaying product-filtered (or all) farm stands."
        );
    }
    // --- END Existing Radius Filter ---

    currentlyDisplayedShops = [...shopsToDisplay];

    const sortCenter = searchCenterLatLng || (map ? map.getCenter() : null);
    renderListings(shopsToDisplay, true, sortCenter);
    plotMarkers(shopsToDisplay);
}


// --- Event Listeners & Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM element variables
  listingsContainer = document.getElementById("listingsContainer");
  searchInput = document.getElementById("searchInput"); // Initialize the global 'searchInput'
  noResultsDiv = document.getElementById("noResults");
  listingsPanelElement = document.getElementById("listingsPanel");
  window.listingsPanelElement = listingsPanelElement; // Explicitly make it a window property
  detailsOverlayShopElement = document.getElementById("detailsOverlayShop");
  window.detailsOverlayShopElement = detailsOverlayShopElement; // Good practice, though uiLogic also does it
  closeDetailsOverlayShopButton = document.getElementById(
    "closeDetailsOverlayShopButton"
  );
  shopDetailNameElement = document.getElementById("shopDetailName");
  detailsOverlaySocialElement = document.getElementById("detailsOverlaySocial");
  detailsOverlaySocialElement = document.getElementById("detailsOverlaySocial");
  window.detailsOverlaySocialElement = detailsOverlaySocialElement; // Good practice
  socialLinksContainerElement = document.getElementById("socialLinksContainer");
  twitterTimelineContainerElement = document.getElementById(
    "twitterTimelineContainer"
  );

  const radiusSliderElement = document.getElementById("radiusSlider"); // Local scope for event listener setup
  const radiusValueElement = document.getElementById("radiusValue"); // Local scope

  if (radiusSliderElement && radiusValueElement) {
    radiusValueElement.textContent = `${radiusSliderElement.value} mi`;
    radiusSliderElement.addEventListener("input", () => {
      radiusValueElement.textContent = `${radiusSliderElement.value} mi`;
    });
    radiusSliderElement.addEventListener("change", () => {
      handleSearch();
    });
  }

  if (searchInput) { // Use the initialized global 'searchInput'
    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim() === "") {
        if (window.lastPlaceSelectedByAutocomplete) {
          window.lastPlaceSelectedByAutocomplete = null;
        }
        // If cleared, re-run search to show all (or all based on product filters)
        handleSearch();
      }
    });
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (
          !window.lastPlaceSelectedByAutocomplete ||
          searchInput.value !==
            (window.lastPlaceSelectedByAutocomplete.formatted_address ||
              window.lastPlaceSelectedByAutocomplete.name)
        ) {
          console.log(
            "Enter pressed on searchInput, no autocomplete selection. Triggering handleSearch for geocoding."
          );
          window.lastPlaceSelectedByAutocomplete = null;
          handleSearch();
        }
      }
    });
  }

  if (closeDetailsOverlayShopButton) {
    closeDetailsOverlayShopButton.addEventListener(
      "click",
      closeClickedShopOverlays
    );
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        const rightIsOpen = detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open');
        const leftIsOpen = detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open');
        if (rightIsOpen || leftIsOpen) {
            if (typeof closeClickedShopOverlays === 'function') closeClickedShopOverlays();
        }
    }
  });

  console.log(
    "DOM fully loaded. App setup initiated. Waiting for Google Maps API to call initAppMap."
  );
});