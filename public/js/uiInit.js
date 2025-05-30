'use strict';

const DEBUG_UI_INIT_JS = false; // <-- !! ADDED DEBUG FLAG !!

/**
 * Sets up the main event listeners when the DOM is ready.
 */
function initializeUI() {
    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] initializeUI called.");

    if (!window.AppState || !window.AppState.dom) {
        // CRITICAL: This error should always log
        console.error("uiInit.js: CRITICAL - AppState or AppState.dom not found on window. Aborting UI initialization.");
        return;
    }
    const dom = AppState.dom;
    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] AppState.dom accessed:", dom);


    // --- Check for essential DOM elements ---
    const essentialElementsCheck = {
        productFilterToggleElement: !!dom.productFilterToggleElement,
        closeDetailsOverlaySocialButton: !!dom.closeDetailsOverlaySocialButton,
        closeDetailsOverlayShopButton: !!dom.closeDetailsOverlayShopButton
        // Add any other elements that are absolutely critical for uiInit.js to function
    };

    let allEssentialFound = true;
    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Checking for essential DOM elements in AppState.dom:");
    for (const key in essentialElementsCheck) {
        if (DEBUG_UI_INIT_JS) console.log(`[uiInit.js_DEBUG]   - dom.${key}: ${essentialElementsCheck[key] ? 'Found' : 'NOT FOUND'}`);
        if (!essentialElementsCheck[key]) {
            allEssentialFound = false;
        }
    }

    if (!allEssentialFound) {
         // CRITICAL: This error should always log
        console.error("uiInit.js: CRITICAL - One or more essential DOM elements not found in AppState.dom. UI setup will be incomplete.");
        if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Aborting further UI initialization due to missing essential DOM elements.");
        return;
    }
    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] All essential DOM elements for uiInit found.");


    // --- Product Filter Setup ---
    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Attempting to setup Product Filter listeners.");
    if (typeof setupProductFilterListeners === 'function') {
        if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Calling setupProductFilterListeners().");
        setupProductFilterListeners();
    } else {
        if (DEBUG_UI_INIT_JS) console.error("[uiInit.js_DEBUG] setupProductFilterListeners function not found.");
        else console.error("uiInit.js: setupProductFilterListeners function not found.");
    }

    // --- Directions Buttons Setup ---
    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Attempting to setup Directions Button listeners.");
     if (typeof setupDirectionsButtonListeners === 'function') {
        if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Calling setupDirectionsButtonListeners().");
        setupDirectionsButtonListeners();
     } else {
         if (DEBUG_UI_INIT_JS) console.error("[uiInit.js_DEBUG] setupDirectionsButtonListeners function not found.");
         else console.error("uiInit.js: setupDirectionsButtonListeners function not found.");
     }

    // --- Overlay Close Buttons ---
    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Attempting to setup Overlay Close Button listeners.");
    if (typeof closeClickedShopOverlaysAndNavigateHome === 'function') {
        if (dom.closeDetailsOverlaySocialButton) {
            dom.closeDetailsOverlaySocialButton.addEventListener('click', () => {
                if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] closeDetailsOverlaySocialButton clicked. Calling closeClickedShopOverlaysAndNavigateHome.");
                closeClickedShopOverlaysAndNavigateHome();
            });
            if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Added click listener to closeDetailsOverlaySocialButton.");
        } else {
            // This case should have been caught by the essential elements check, but good to be thorough
            if (DEBUG_UI_INIT_JS) console.error("[uiInit.js_DEBUG] dom.closeDetailsOverlaySocialButton not found when trying to add listener (should have been caught earlier).");
        }

        if (dom.closeDetailsOverlayShopButton) {
            dom.closeDetailsOverlayShopButton.addEventListener('click', () => {
                if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] closeDetailsOverlayShopButton clicked. Calling closeClickedShopOverlaysAndNavigateHome.");
                closeClickedShopOverlaysAndNavigateHome();
            });
            if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Added click listener to closeDetailsOverlayShopButton.");
        } else {
            if (DEBUG_UI_INIT_JS) console.error("[uiInit.js_DEBUG] dom.closeDetailsOverlayShopButton not found when trying to add listener (should have been caught earlier).");
        }
    } else {
         if (DEBUG_UI_INIT_JS) console.error("[uiInit.js_DEBUG] closeClickedShopOverlaysAndNavigateHome function not found.");
         else console.error("uiInit.js: closeClickedShopOverlaysAndNavigateHome function not found.");
    }

    // --- Social Overlay Tabs Setup ---
    // (Moved to be called within openClickedShopOverlays to ensure elements exist)
    // If you need initial setup or persistent listeners, add them here.
    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] Social Overlay Tabs setup is expected to be handled within openClickedShopOverlays.");

    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] UI Initialized successfully.");
    else console.log("uiInit.js: UI Initialized."); // Original log
}

// --- Add the listener ---
document.addEventListener('DOMContentLoaded', () => {
    if (DEBUG_UI_INIT_JS) console.log("[uiInit.js_DEBUG] DOMContentLoaded event fired. Calling initializeUI.");
    initializeUI();
});