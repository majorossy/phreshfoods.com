// public/js/uiInit.js
'use strict';

/**
 * Sets up the main event listeners when the DOM is ready.
 */
function initializeUI() {
    const dom = AppState.dom;

    // --- Check for essential DOM elements ---
    if (!dom || !dom.productFilterToggleElement || !dom.closeDetailsOverlaySocialButton || !dom.closeDetailsOverlayShopButton) {
         console.error("uiInit.js: CRITICAL - One or more essential DOM elements not found in AppState.dom. UI setup will be incomplete.");
        return;
    }

    // --- Product Filter Setup ---
    if (typeof setupProductFilterListeners === 'function') {
        setupProductFilterListeners();
    } else {
        console.error("uiInit.js: setupProductFilterListeners function not found.");
    }

    // --- Directions Buttons Setup ---
     if (typeof setupDirectionsButtonListeners === 'function') {
        setupDirectionsButtonListeners();
     } else {
         console.error("uiInit.js: setupDirectionsButtonListeners function not found.");
     }

    // --- Overlay Close Buttons ---
    if (typeof closeClickedShopOverlaysAndNavigateHome === 'function') {
        dom.closeDetailsOverlaySocialButton.addEventListener('click', closeClickedShopOverlaysAndNavigateHome);
        dom.closeDetailsOverlayShopButton.addEventListener('click', closeClickedShopOverlaysAndNavigateHome);
    } else {
         console.error("uiInit.js: closeClickedShopOverlaysAndNavigateHome function not found.");
    }

    // --- Social Overlay Tabs Setup ---
    // (Moved to be called within openClickedShopOverlays to ensure elements exist)
    // If you need initial setup or persistent listeners, add them here.
    console.log("uiInit.js: UI Initialized.");
}

// --- Add the listener ---
document.addEventListener('DOMContentLoaded', initializeUI);