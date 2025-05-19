// js/main.js

// --- Global State Variables ---
let allFarmStands = [];
let currentlyDisplayedShops = []; // Shops currently shown in the list (can be all or filtered)
let markerClickedRecently = false; // For map click vs marker click logic

// --- DOM Element Variables (to be initialized on DOMContentLoaded) ---
let listingsContainer, searchInput, noResultsDiv, listingsPanelElement,
    detailsOverlayShopElement, closeDetailsOverlayShopButton,
    shopDetailNameElement, shopDetailRatingStarsElement, shopDetailAddressElement,
    shopDetailDistanceElement, shopDetailPhoneElement, shopDetailWebsiteElement,
    shopDetailMapLinkContainerElement, detailsOverlaySocialElement,
    closeDetailsOverlaySocialButton, socialLinksContainerElement,
    twitterTimelineContainerElement;


async function processAndPlotShops() {
    console.log("processAndPlotShops called");
    if (listingsContainer) listingsContainer.innerHTML = '<p class="text-center text-gray-700 p-4">Loading farm stands...</p>';

    allFarmStands = await fetchSheetData(); // from apiService.js
    if (allFarmStands.length === 0) {
        if (noResultsDiv) {
             noResultsDiv.textContent = GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER ? 'Data source not configured.' : 'No fa shops data found.';
             noResultsDiv.classList.remove('hidden');
        }
        if (listingsContainer) listingsContainer.classList.add('hidden');
        currentlyDisplayedShops = [];
        return;
    }
    // Optional: Initial sort before distance, e.g., by rating
    // allFarmStands.sort((a,b) => (parseFloat(b.Rating) || 0) - (parseFloat(a.Rating) || 0) || a.Name.localeCompare(b.Name));
    currentlyDisplayedShops = [...allFarmStands];
    renderListings(currentlyDisplayedShops, true); // from uiLogic.js - initial render will sort by distance
    plotMarkers(allFarmStands); // from mapLogic.js
}

function handleSearch() {
    if (!searchInput) return;
    const searchTerm = searchInput.value.toLowerCase().trim();
    let filteredShops;
    if (!searchTerm) {
        filteredShops = [...allFarmStands];
    } else {
        filteredShops = allFarmStands.filter(shop =>
            shop.Name.toLowerCase().includes(searchTerm) ||
            (shop.City && shop.City.toLowerCase().includes(searchTerm)) ||
            (shop.Address && shop.Address.toLowerCase().includes(searchTerm))
        );
    }
    renderListings(filteredShops, true); // from uiLogic.js - sort search results by distance
    plotMarkers(filteredShops); // from mapLogic.js - update markers based on search
}


// --- Event Listeners & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM element variables
    listingsContainer = document.getElementById('listingsContainer');
    searchInput = document.getElementById('searchInput');
    noResultsDiv = document.getElementById('noResults');
    listingsPanelElement = document.getElementById('listingsPanel');
    detailsOverlayShopElement = document.getElementById('detailsOverlayShop');
    closeDetailsOverlayShopButton = document.getElementById('closeDetailsOverlayShopButton');
    shopDetailNameElement = document.getElementById('shopDetailName');
    shopDetailRatingStarsElement = document.getElementById('shopDetailRatingStars');
    shopDetailAddressElement = document.getElementById('shopDetailAddress');
    shopDetailDistanceElement = document.getElementById('shopDetailDistance');
    shopDetailPhoneElement = document.getElementById('shopDetailPhone');
    shopDetailWebsiteElement = document.getElementById('shopDetailWebsite');
    shopDetailMapLinkContainerElement = document.getElementById('shopDetailMapLinkContainer');
    detailsOverlaySocialElement = document.getElementById('detailsOverlaySocial');
    closeDetailsOverlaySocialButton = document.getElementById('closeDetailsOverlaySocialButton');
    socialLinksContainerElement = document.getElementById('socialLinksContainer');
    twitterTimelineContainerElement = document.getElementById('twitterTimelineContainer');

    // Setup event listeners
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (closeDetailsOverlayShopButton) closeDetailsOverlayShopButton.addEventListener('click', closeClickedShopOverlays); // from uiLogic.js
    if (closeDetailsOverlaySocialButton) closeDetailsOverlaySocialButton.addEventListener('click', closeClickedShopOverlays); // from uiLogic.js

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' &&
           ((detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open')) ||
            (detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open')))) {
            closeClickedShopOverlays(); // from uiLogic.js
        }
    });

    // Note: initAppMap is called by the Google Maps API script, not directly here.
    // processAndPlotShops will be called from initAppMap once the map is ready.
    console.log("DOM fully loaded and parsed. Waiting for Google Maps API to call initAppMap.");
});

// Make initAppMap globally accessible for the Google Maps callback
// It's defined in mapLogic.js, which should be loaded before this point if order is correct,
// but to be safe, we ensure it's on window if mapLogic.js defines it as a global function.
// window.initAppMap = initAppMap; // This line is actually not needed if initAppMap is already global from mapLogic.js
















