// public/js/directionsUI.js
'use strict';

/**
 * Initiates the process to calculate and display a route to the shop.
 * @param {Object} shop - The shop data object.
 */
function handleGetDirections(shop) {
    if (!shop) { alert("Shop data is unavailable for directions."); return; }
    let destinationPayload = {};
    if (shop.lat && shop.lng) {
        destinationPayload = { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng), Name: shop.Name };
    } else if (shop.GoogleProfileID) {
        destinationPayload = { GoogleProfileID: shop.GoogleProfileID, Name: shop.Name };
    } else if (shop.Address && shop.Address !== 'N/A') {
        destinationPayload = { Address: shop.Address, Name: shop.Name };
    } else {
        alert(`Not enough information to get directions for ${escapeHTML(shop.Name)}.`);
        return;
    }

    if (typeof calculateAndDisplayRoute === 'function') { // from mapLogic.js
        calculateAndDisplayRoute(destinationPayload);
    } else {
        console.error("directionsUI.js: calculateAndDisplayRoute function is not defined.");
        alert("Directions feature is currently unavailable.");
    }
}

/**
 * Handles clicks on the 'Directions' button within a map InfoWindow.
 * It finds the shop by its identifier (slug or Place ID) and triggers
 * the overlay opening and directions process.
 * @param {string} shopIdentifier - The slug or Google Place ID of the shop.
 */
function handleInfoWindowDirectionsClickById(shopIdentifier) {
    if (!shopIdentifier) {
        console.error("handleInfoWindowDirectionsClickById: No shopIdentifier provided.");
        alert("Cannot get directions, shop identifier missing.");
        return;
    }

    let shop = (AppState.currentlyDisplayedShops || []).find(s => s.slug === shopIdentifier || s.GoogleProfileID === shopIdentifier)
            || (AppState.allFarmStands || []).find(s => s.slug === shopIdentifier || s.GoogleProfileID === shopIdentifier);

    if (shop) {
        if (typeof infowindow !== 'undefined' && infowindow?.close === 'function') {
            infowindow.close(); // Close infowindow before opening overlays
        }
        if (typeof openClickedShopOverlays === 'function') openClickedShopOverlays(shop); // from overlayManager.js
        setTimeout(() => { // Delay slightly
            handleGetDirections(shop);
        }, 150);
    } else {
        console.error("handleInfoWindowDirectionsClickById: Shop not found for identifier:", shopIdentifier);
        alert("Could not find shop data for directions.");
    }
}

/**
 * Sets up listeners for the main directions buttons in the shop overlay.
 */
function setupDirectionsButtonListeners() {
    const dom = AppState.dom;
    if (dom.getShopDirectionsButton) {
        dom.getShopDirectionsButton.addEventListener('click', () => {
            if (AppState.currentShopForDirections) {
                handleGetDirections(AppState.currentShopForDirections);
            } else {
                alert("Please select a shop first.");
            }
        });
    }
    if (dom.clearShopDirectionsButton) {
        dom.clearShopDirectionsButton.addEventListener('click', () => {
            if (typeof clearDirections === 'function') clearDirections(); // from mapLogic.js
        });
    }
}