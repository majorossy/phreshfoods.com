// js/main.js

// --- Global State Variables ---
let allFarmStands = [];
let currentlyDisplayedShops = []; // Shops currently shown in the list (can be all or filtered)
let markerClickedRecently = false; // For map click vs marker click logic
let currentShopForDirections = null;
let radiusSliderElement, radiusValueElement; // NEW: For slider

// --- DOM Element Variables (to be initialized on DOMContentLoaded) ---
let listingsContainer,
  searchInput,
  noResultsDiv,
  listingsPanelElement,
  detailsOverlayShopElement,
  closeDetailsOverlayShopButton,
  shopDetailNameElement,
  shopDetailRatingStarsElement,
  shopDetailAddressElement,
  shopDetailDistanceElement,
  shopDetailPhoneElement,
  shopDetailWebsiteElement,
  shopDetailMapLinkContainerElement,
  detailsOverlaySocialElement,
  closeDetailsOverlaySocialButton,
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
              // console.log(`Populated lat/lng for ${shop.Name} via PlaceID`);
            } else {
              // console.warn(`Place Details failed for ${shop.Name} (ID: ${shop.GoogleProfileID}): ${status}. Trying address.`);
              if (shop.Address && shop.Address !== "N/A") {
                window.geocoder.geocode(
                  { address: shop.Address + ", Maine, USA" },
                  (results, geoStatus) => {
                    if (geoStatus === "OK" && results[0]?.geometry) {
                      shop.lat = results[0].geometry.location.lat();
                      shop.lng = results[0].geometry.location.lng();
                      // console.log(`Populated lat/lng for ${shop.Name} via Address (fallback).`);
                    } else {
                      console.warn(
                        `Geocode fallback also failed for ${shop.Name}: ${geoStatus}`
                      );
                    }
                    resolve(); // Resolve after geocode attempt
                  }
                );
                return; // Important: return here because geocode is async, resolve is called within it
              } else {
                console.warn(
                  `Could not get geometry for ${shop.Name} (ID: ${shop.GoogleProfileID}) and no address for fallback.`
                );
              }
            }
            resolve(); // Resolve after Place Details attempt (or if no address fallback)
          }
        );
      } else if (shop.Address && shop.Address !== "N/A") {
        window.geocoder.geocode(
          { address: shop.Address + ", Maine, USA" },
          (results, geoStatus) => {
            if (geoStatus === "OK" && results[0]?.geometry) {
              shop.lat = results[0].geometry.location.lat();
              shop.lng = results[0].geometry.location.lng();
              // console.log(`Populated lat/lng for ${shop.Name} via Address.`);
            } else {
              console.warn(
                `Geocode failed for ${shop.Name} (Address: ${shop.Address}): ${geoStatus}`
              );
            }
            resolve(); // Resolve after geocode attempt
          }
        );
      } else {
        console.warn(
          `Cannot determine Lat/Lng for ${shop.Name}: No PlaceID or Address.`
        );
        resolve(); // Resolve if no method to get lat/lng
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

  // Populate lat/lng for all farm stands before any filtering or plotting
  await populateAllShopsWithLatLng(allFarmStands);

  currentlyDisplayedShops = [...allFarmStands];
  // Initial call to handleSearch will display all shops, sorted by distance to map center
  await handleSearch();
}

async function handleSearch() {
  console.log("handleSearch triggered.");
  let searchCenterLatLng = null;
  let selectedPlaceName = searchInput.value;

  if (
    window.lastPlaceSelectedByAutocomplete &&
    window.lastPlaceSelectedByAutocomplete.geometry &&
    window.lastPlaceSelectedByAutocomplete.geometry.location
  ) {
    searchCenterLatLng =
      window.lastPlaceSelectedByAutocomplete.geometry.location;
    selectedPlaceName =
      window.lastPlaceSelectedByAutocomplete.name ||
      window.lastPlaceSelectedByAutocomplete.formatted_address ||
      selectedPlaceName;
    // console.log("Using autocomplete selection for search center:", selectedPlaceName, searchCenterLatLng.toString());
  } else {
    // If no autocomplete, but search input has text, try to geocode it to get a center.
    // This allows radius filter even without explicit autocomplete selection if user just types a city and hits enter/search.
    if (searchInput.value.trim() !== "") {
      console.log(
        "No autocomplete selection, attempting to geocode search input for radius center:",
        searchInput.value
      );
      try {
        const geocodeResults = await new Promise((resolve, reject) => {
          if (!window.geocoder) {
            reject("Geocoder not available");
            return;
          }
          window.geocoder.geocode(
            { address: searchInput.value.trim() + ", Maine, USA" },
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
        // Optionally pan map if geocoding was successful and not from autocomplete
        if (map && !window.lastPlaceSelectedByAutocomplete) {
          map.setCenter(getAdjustedMapCenter(searchCenterLatLng));
          map.setZoom(10); // Adjust zoom as appropriate for a geocoded area
        }
      } catch (error) {
        console.warn(
          "Geocoding error for search input '" +
            searchInput.value.trim() +
            "':",
          error
        );
        // searchCenterLatLng remains null, radius filter won't apply without a center
      }
    } else {
      // console.log("Search input is empty, and no autocomplete. No location-based filter.");
    }
  }

  let shopsToDisplay;
  const selectedRadiusMiles = radiusSliderElement
    ? parseInt(radiusSliderElement.value)
    : 30; // Get value from slider, default 30

  if (searchCenterLatLng) {
    // Only apply radius filter if we have a center
    const radiusMeters = selectedRadiusMiles * 1609.344;

    console.log(
      `Filtering shops within ${selectedRadiusMiles} miles (${radiusMeters.toFixed(
        0
      )}m) of selected location.`
    );

    shopsToDisplay = allFarmStands.filter((shop) => {
      // ... (distance filtering logic as before) ...
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
    // console.log(`${shopsToDisplay.length} shops found within radius.`);
  } else {
    console.log(
      "No search center determined for radius filter. Displaying all available farm stands."
    );
    shopsToDisplay = [...allFarmStands];
  }

  currentlyDisplayedShops = [...shopsToDisplay];

  const sortCenter = searchCenterLatLng || (map ? map.getCenter() : null);
  renderListings(shopsToDisplay, true, sortCenter); // renderListings should ideally use currentlyDisplayedShops
  plotMarkers(shopsToDisplay);
}

// --- Event Listeners & Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM element variables
  listingsContainer = document.getElementById("listingsContainer");
  searchInput = document.getElementById("searchInput");
  noResultsDiv = document.getElementById("noResults");
  listingsPanelElement = document.getElementById("listingsPanel");
  detailsOverlayShopElement = document.getElementById("detailsOverlayShop");
  closeDetailsOverlayShopButton = document.getElementById(
    "closeDetailsOverlayShopButton"
  );
  shopDetailNameElement = document.getElementById("shopDetailName");
  // shopDetailRatingStarsElement = document.getElementById('shopDetailRatingStars'); // Not used directly, handled in card
  // shopDetailAddressElement = document.getElementById('shopDetailAddress'); // Not used directly
  // shopDetailDistanceElement = document.getElementById('shopDetailDistance'); // Not used directly
  // shopDetailPhoneElement = document.getElementById('shopDetailPhone'); // Not used directly
  // shopDetailWebsiteElement = document.getElementById('shopDetailWebsite'); // Not used directly
  // shopDetailMapLinkContainerElement = document.getElementById('shopDetailMapLinkContainer'); // Not used directly
  detailsOverlaySocialElement = document.getElementById("detailsOverlaySocial");
  // closeDetailsOverlaySocialButton = document.getElementById('closeDetailsOverlaySocialButton'); // Already handled by general overlay close
  socialLinksContainerElement = document.getElementById("socialLinksContainer");
  twitterTimelineContainerElement = document.getElementById(
    "twitterTimelineContainer"
  );

  // NEW: Slider elements and event listener
  radiusSliderElement = document.getElementById("radiusSlider");
  radiusValueElement = document.getElementById("radiusValue");

  if (radiusSliderElement && radiusValueElement) {
    // Initialize display
    radiusValueElement.textContent = `${radiusSliderElement.value} mi`;

    // Update display on input and trigger search on change
    radiusSliderElement.addEventListener("input", () => {
      radiusValueElement.textContent = `${radiusSliderElement.value} mi`;
    });
    radiusSliderElement.addEventListener("change", () => {
      // 'change' event fires when user releases mouse
      handleSearch(); // Re-run search with new radius
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim() === "") {
        if (window.lastPlaceSelectedByAutocomplete) {
          window.lastPlaceSelectedByAutocomplete = null;
        }
        // Don't call handleSearch on every input if using autocomplete,
        // but do if user clears it to reset to all.
        // handleSearch(); // Or maybe only if explicitly cleared.
      }
    });
    // Handle Enter key on searchInput to trigger geocoding if no autocomplete selection made
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent form submission if it's in a form
        // If autocomplete hasn't set a place, or if the current value isn't from autocomplete.
        if (
          !window.lastPlaceSelectedByAutocomplete ||
          searchInput.value !==
            (window.lastPlaceSelectedByAutocomplete.formatted_address ||
              window.lastPlaceSelectedByAutocomplete.name)
        ) {
          console.log(
            "Enter pressed on searchInput, no autocomplete selection. Triggering handleSearch for geocoding."
          );
          window.lastPlaceSelectedByAutocomplete = null; // Ensure we try to geocode the typed text
          handleSearch();
        }
        // If autocomplete HAS made a selection, place_changed already called handleSearch.
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
    /* ... ESC key listener ... */
  });

  console.log(
    "DOM fully loaded. App setup initiated. Waiting for Google Maps API to call initAppMap."
  );
});
