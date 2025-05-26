'use strict';

const AppState = {
    // --- Core Data State ---
    allFarmStands: [],                 // Array of all farm stand objects after fetching and parsing
    currentlyDisplayedShops: [],       // Array of shop objects currently shown in the listings and on map
    activeProductFilters: {},          // Object storing active product filters, e.g., { beef: true, corn: false }

    // --- User Interaction State ---
    lastPlaceSelectedByAutocomplete: null, // Stores the full Google Place object from last autocomplete
    currentShopForDirections: null,    // Stores the shop object for which directions are being shown/requested
    markerClickedRecently: false,      // Flag to manage map click vs. marker click interaction

    // --- Shared DOM Element References ---
    // These will be populated in main.js's DOMContentLoaded listener
    dom: {
        // Main layout and core components
        mapElement: null,                        // The div#map for Google Maps
        listingsContainer: null,                 // Div where shop cards are rendered
        searchInput: null,                       // The main search input field
        noResultsDiv: null,                      // Div to show "no results" messages
        listingsPanelElement: null,              // The entire right-hand listings panel section
        radiusSliderElement: null,               // The range input for radius
        radiusValueElement: null,                // Span to display the radius value

        // Overlay Elements
        detailsOverlayShopElement: null,         // The shop details overlay (right panel)
        detailsOverlaySocialElement: null,       // The social/reviews overlay (left panel)

        // Elements within Shop Details Overlay
        shopDetailNameElement: null,             // h2 for the shop name in the overlay
        shopImageGallery: null,                  // Div for CSV images in shop overlay
        shopProductIconsContainer: null,         // Div for product icons in shop overlay
        shopOpeningHoursContainer: null,         // Div for opening hours in shop overlay
        getShopDirectionsButton: null,           // Button to trigger directions in shop overlay
        clearShopDirectionsButton: null,         // Button to clear directions
        directionsPanel: null,                   // Div to display textual directions

        // Elements within Social Overlay
        socialLinksContainer: null,              // For Facebook embed
        twitterTimelineContainer: null,          // For Twitter embed
        instagramFeedContainer: null,            // For Instagram embed
        socialOverlayReviewsContainer: null,     // For Google Reviews
        socialOverlayGooglePhotosContainer: null, // For Google Photos
        socialOverlayTabs: null,                 // Nav container for social tabs
        closeDetailsOverlaySocialButton: null,   // Close button for social overlay
        closeDetailsOverlayShopButton: null,     // Close button for shop overlay

        // Product Filter UI Elements
        productFilterToggleElement: null,        // Button to open/close product filter dropdown
        productFilterDropdownElement: null,      // The dropdown container itself
        productFilterCheckboxesContainer: null,  // Div where filter checkboxes are rendered
        resetProductFiltersButton: null,         // Button to reset product filters
        activeFilterCountElement: null,          // Span to show count of active product filters
        
        // Initial Search Modal elements (if not already covered or if needed by other modules via AppState)
        // initialSearchModal: null, // Example: document.getElementById('initialSearchModal')
        // modalSearchInput: null,   // Example: document.getElementById('modalSearchInput')
        // modalSearchButton: null,  // Example: document.getElementById('modalSearchButton')
        // modalSkipButton: null,    // Example: document.getElementById('modalSkipButton')
    }
    // --- You can add other shared states or configurations here as needed ---
};

// Make AppState globally accessible
window.AppState = AppState;