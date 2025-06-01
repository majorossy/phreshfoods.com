'use strict';
const DEBUG_APPSTATE = false;

function appStateDebugLog(...args) {
    if (DEBUG_APPSTATE) console.log('[appState-DEBUG]', ...args);
}
function appStateDebugWarn(...args) {
    if (DEBUG_APPSTATE) console.warn('[appState-WARN]', ...args);
}
function appStateDebugError(...args) {
    if (DEBUG_APPSTATE) console.error('[appState-ERROR]', ...args);
}

const AppState = {
    // --- Core Data State ---
    allFarmStands: [],
    currentlyDisplayedShops: [],
    activeProductFilters: {},

    // --- User Interaction State ---
    lastPlaceSelectedByAutocomplete: null, // Stores the full Google Place object (or PlaceResult from PlaceAutocompleteElement)
    currentShopForDirections: null,
    markerClickedRecently: false,

    // --- Shared DOM Element References ---
    dom: {
        // Main layout and core components
        mapElement: null,
        listingsContainer: null,
        // searchInput: null,                       // OLD: The main search input field
        searchAutocompleteElement: null,         // NEW: The main <gmp-place-autocomplete> element
        noResultsDiv: null,
        listingsPanelElement: null,
        radiusSliderElement: null,
        radiusValueElement: null,

        // Overlay Elements
        detailsOverlayShopElement: null,
        detailsOverlaySocialElement: null,

        // Elements within Shop Details Overlay
        shopDetailNameElement: null,
        shopImageGallery: null,
        shopProductIconsContainer: null,
        shopOpeningHoursContainer: null,
        getShopDirectionsButton: null,
        clearShopDirectionsButton: null,
        directionsPanel: null,

        // Elements within Social Overlay
        socialLinksContainer: null,
        twitterTimelineContainer: null,
        instagramFeedContainer: null,
        socialOverlayReviewsContainer: null,
        socialOverlayGooglePhotosContainer: null,
        socialOverlayTabs: null,
        closeDetailsOverlaySocialButton: null,
        closeDetailsOverlayShopButton: null,

        // Product Filter UI Elements
        productFilterToggleElement: null,
        productFilterDropdownElement: null,
        productFilterCheckboxesContainer: null,
        resetProductFiltersButton: null,
        activeFilterCountElement: null,

        // Initial Search Modal elements
        // initialSearchModal: null, // Populated directly in main.js if needed by it only
        modalSearchAutocompleteElement: null,  // NEW: The modal's <gmp-place-autocomplete> element
        // modalSearchButton: null, // Populated directly in main.js
        // modalSkipButton: null,   // Populated directly in main.js
    }
};

// Make AppState globally accessible
window.AppState = AppState;