// public/js/overlayManager.js
'use strict';
const DEBUG_OVERLAY = false;

function overlayDebugLog(...args) {
    if (DEBUG_OVERLAY) console.log('[overlay-DEBUG]', ...args);
}
function overlayDebugWarn(...args) {
    if (DEBUG_OVERLAY) console.warn('[overlay-WARN]', ...args);
}
function overlayDebugError(...args) {
    if (DEBUG_OVERLAY) console.error('[overlay-ERROR]', ...args);
}

/**
 * Opens a specified overlay panel with a transition.
 * @param {HTMLElement} overlayElement - The overlay DOM element.
 */
function openOverlay(overlayElement) {
    overlayDebugLog('[OverlayManager-DEBUG] openOverlay called for element ID:', overlayElement?.id, 'Timestamp:', Date.now()); 
    overlayDebugLog('openOverlay() called');
    if (!overlayElement) return;
    overlayElement.classList.remove('hidden');
    requestAnimationFrame(() => overlayElement.classList.add('is-open'));
    document.body.classList.add('modal-active');
}

/**
 * Closes a specified overlay panel with a transition.
 * @param {HTMLElement} overlayElement - The overlay DOM element.
 */
function closeOverlay(overlayElement) {
    overlayDebugLog('[OverlayManager-DEBUG] closeOverlay called for element ID:', overlayElement?.id, 'Timestamp:', Date.now()); // ADD LOG
    overlayDebugLog('closeOverlay() called for element ID:', overlayElement?.id); // Your existing log
    if (!overlayElement) return;
    overlayElement.classList.remove('is-open');
    // Ensure it's hidden. Using 'hidden' class is good as it often sets display:none.
    // If 'hidden' doesn't reliably set display:none, you might need:
    // overlayElement.style.display = 'none';
    // However, your CSS probably handles .hidden correctly.
    overlayElement.classList.add('hidden');


    // Check if any modal/overlay is still open before removing modal-active
    const dom = AppState.dom;
    if (dom.initialSearchModal?.classList.contains('modal-open') || // Check initial modal state
        dom.detailsOverlayShopElement?.classList.contains('is-open') ||
        dom.detailsOverlaySocialElement?.classList.contains('is-open')) {
        overlayDebugLog("Body class 'modal-active' NOT removed by closeOverlay because other overlays/modal are still open."); // ADD LOG
    } else {
        document.body.classList.remove('modal-active');
        overlayDebugLog("Body class 'modal-active' REMOVED by closeOverlay."); // ADD LOG
    }
}

/**
 * Closes any open shop/social overlays without changing the URL.
 */
function closeClickedShopOverlays() {
    const dom = AppState.dom;
    let anOverlayWasOpen = false;
    if (dom.detailsOverlayShopElement?.classList.contains('is-open')) {
        closeOverlay(dom.detailsOverlayShopElement); anOverlayWasOpen = true;
    }
    if (dom.detailsOverlaySocialElement?.classList.contains('is-open')) {
        closeOverlay(dom.detailsOverlaySocialElement); anOverlayWasOpen = true;
    }
    if (anOverlayWasOpen) {
        if (typeof infowindow !== 'undefined' && infowindow?.close === 'function') infowindow.close();
        AppState.currentShopForDirections = null;
        // Clear placeholder texts (optional)
        ['socialLinksContainer', 'twitterTimelineContainer', 'instagramFeedContainer', 'socialOverlayReviewsContainer', 'socialOverlayGooglePhotosContainer']
            .forEach(key => { if(dom[key]) dom[key].innerHTML = `<p class="text-sm text-gray-500 p-4 text-center">...</p>`; });
    }
}

/**
 * Closes any open overlays and navigates back to the home ('/') route if not already there.
 */
function closeClickedShopOverlaysAndNavigateHome() {
    const wasOnStorePage = window.location.pathname.startsWith('/farm/');
    closeClickedShopOverlays(); // Close UI
    if (wasOnStorePage && window.location.pathname !== '/') {
        window.history.pushState({}, "All Farm Stands", "/");
        if (typeof handleRouteChange === 'function') handleRouteChange();
    }
}

/**
 * Opens both shop and social overlays and populates them with data.
 * @param {Object} shop - The shop data object.
 */
// public/js/overlayManager.js
// ... (other functions: openOverlay, closeOverlay, etc.) ...

// In overlayManager.js

// ... (DEBUG_OVERLAY and helper functions like openOverlay, closeOverlay, etc.) ...

async function openClickedShopOverlays(shop) {
    if (!shop) {
        overlayDebugError("openClickedShopOverlays: Shop data is null. Aborting.");
        return;
    }
    AppState.currentShopForDirections = shop;
    const dom = AppState.dom;
    overlayDebugLog("openClickedShopOverlays called for:", shop.Name, "Current placeDetails from JSON:", JSON.parse(JSON.stringify(shop.placeDetails || {})));

    // --- Populate & Open Shop Details Overlay (Right) ---
    if (dom.detailsOverlayShopElement) {
        openOverlay(dom.detailsOverlayShopElement);
        dom.detailsOverlayShopElement.scrollTop = 0;

        const displayName = shop.placeDetails?.name || shop.Name || 'Farm Stand Details';
        if (dom.shopDetailNameElement) dom.shopDetailNameElement.textContent = displayName;

        if (dom.shopImageGallery) {
            dom.shopImageGallery.innerHTML = ''; // Clear previous
            let hasImages = false;
            [shop.ImageOne, shop.ImageTwo, shop.ImageThree].filter(Boolean).forEach(imgName => {
                if (imgName.trim()) {
                    const container = document.createElement('div');
                    container.className = 'gallery-image-container'; // Add appropriate styling
                    const img = document.createElement('img');
                    img.src = `/images/${imgName.trim()}`; // Assuming images are in /public/images/
                    img.alt = `${escapeHTML(displayName)} image`;
                    img.className = 'gallery-image'; // Add appropriate styling
                    img.loading = 'lazy';
                    img.onerror = function() { this.parentElement.innerHTML = '<p class="text-xs text-gray-500 p-1">Image missing</p>'; };
                    container.appendChild(img);
                    dom.shopImageGallery.appendChild(container);
                    hasImages = true;
                }
            });
            if (!hasImages) {
                dom.shopImageGallery.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No provided photos for this stand.</p>';
            }
        }

        if (dom.shopProductIconsContainer && typeof generateProductIconsHTML === 'function') {
            dom.shopProductIconsContainer.innerHTML = generateProductIconsHTML(shop);
        }

        if(dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.remove('hidden');
        if(dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.add('hidden');
        if(dom.directionsPanel) dom.directionsPanel.innerHTML = "";

        // Initial display of hours from JSON (placeDetails might have opening_hours from background job)
        if (dom.shopOpeningHoursContainer && typeof displayOpeningHours === 'function') {
            if (shop.placeDetails?.opening_hours || shop.placeDetails?.business_status) {
                overlayDebugLog("Displaying initial opening hours from cached placeDetails (JSON).");
                displayOpeningHours(shop.placeDetails, dom.shopOpeningHoursContainer);
            } else {
                // If no hours info at all in JSON, show loading
                dom.shopOpeningHoursContainer.innerHTML = '<p class="text-sm p-2 text-center">Loading hours...</p>';
            }
        }
    }

    // --- Populate & Open Social Media Overlay (Left) ---
    if (dom.detailsOverlaySocialElement) {
        openOverlay(dom.detailsOverlaySocialElement);
        dom.detailsOverlaySocialElement.scrollTop = 0;

        // Reset tab content areas
        ['socialLinksContainer', 'twitterTimelineContainer', 'instagramFeedContainer', 'socialOverlayReviewsContainer', 'socialOverlayGooglePhotosContainer']
            .forEach(key => { if(dom[key]) dom[key].innerHTML = `<p class="text-sm p-4 text-center">Loading...</p>`; });

        // Populate static social tabs first (Facebook, Twitter, Instagram from sheet data)
        const displayNameForSocial = shop.placeDetails?.name || shop.Name;
        if (dom.socialLinksContainer && typeof generateFacebookPagePluginHTML === 'function') {
            dom.socialLinksContainer.innerHTML = shop.FacebookPageID ? generateFacebookPagePluginHTML(shop.FacebookPageID, displayNameForSocial) : '<p class="text-sm p-4 text-center">No Facebook page listed.</p>';
        }
        if (dom.twitterTimelineContainer && typeof displayTwitterTimeline === 'function') {
            displayTwitterTimeline(shop.TwitterHandle, dom.twitterTimelineContainer);
        }
        if (dom.instagramFeedContainer && typeof populateInstagramTab === 'function') {
            populateInstagramTab(shop, dom.instagramFeedContainer);
        }

        // This function will be called to update UI with Google data (initial from JSON, then fresh)
        const updateGoogleUIData = (currentPlaceDetails) => {
            overlayDebugLog("updateGoogleUIData called with:", JSON.parse(JSON.stringify(currentPlaceDetails || {})));
            if (dom.socialOverlayReviewsContainer && typeof displayShopReviews === 'function') {
                displayShopReviews(currentPlaceDetails, dom.socialOverlayReviewsContainer);
            }
            if (dom.socialOverlayGooglePhotosContainer && typeof displayGooglePlacePhotos === 'function') {
                displayGooglePlacePhotos(currentPlaceDetails, dom.socialOverlayGooglePhotosContainer);
            }
            // This call ensures opening hours (especially "Open Now") are updated with the latest fetched data
            if (dom.shopOpeningHoursContainer && typeof displayOpeningHours === 'function') {
                overlayDebugLog("Re-rendering opening hours with potentially fresh data.");
                displayOpeningHours(currentPlaceDetails, dom.shopOpeningHoursContainer);
            }

            // Re-parse Facebook XFBML if the tab is active or content has been added
            if (typeof FB !== 'undefined' && FB.XFBML && dom.socialLinksContainer.querySelector('.fb-page')) {
                const facebookTab = dom.socialOverlayTabs?.querySelector('[data-tab-target="social-facebook-panel"]');
                if (!facebookTab || facebookTab.classList.contains('active-social-tab')) { // Reparse if active or no tabs
                    overlayDebugLog("Reparsing Facebook XFBML.");
                    setTimeout(() => FB.XFBML.parse(dom.socialLinksContainer), 50);
                }
            }
        };

        // Fetch details from Google Places API (on-demand)
        if (shop.GoogleProfileID && typeof getPlaceDetailsClient === 'function') {
            let fieldsToFetchOnDemand = [];

            // Always fetch opening_hours and business_status for the freshest open_now
            fieldsToFetchOnDemand.push('opening_hours', 'business_status');

            // Add other fields if they likely weren't in the basic JSON payload
            // or if you always want them fresh for the overlays.
            if (!shop.placeDetails?.reviews) fieldsToFetchOnDemand.push('reviews'); // Reviews are usually larger
            if (!shop.placeDetails?.photos) fieldsToFetchOnDemand.push('photos');   // Photos refs
            if (!shop.placeDetails?.url) fieldsToFetchOnDemand.push('url');       // Google Maps link for "all reviews"

            // Ensure no duplicate fields
            fieldsToFetchOnDemand = [...new Set(fieldsToFetchOnDemand)];

            overlayDebugLog(`On-demand fetch for overlays. Fields: ${fieldsToFetchOnDemand.join(',')}`);
            getPlaceDetailsClient(shop.GoogleProfileID, fieldsToFetchOnDemand.join(','))
                .then(newlyFetchedDetails => {
                    if (newlyFetchedDetails) {
                        overlayDebugLog("Successfully fetched on-demand details:", JSON.parse(JSON.stringify(newlyFetchedDetails)));
                        // Merge: prioritize newly fetched details, especially for opening_hours
                        shop.placeDetails = {
                            ...(shop.placeDetails || {}), // Start with what we had (from JSON, enriched by background job)
                            ...newlyFetchedDetails       // Override/add with fresh data from this on-demand call
                        };
                    } else {
                        overlayDebugLog("On-demand fetch returned no new details. Using existing placeDetails from JSON.");
                        // shop.placeDetails remains as it was (from JSON)
                    }
                    updateGoogleUIData(shop.placeDetails || null); // Update UI with the most complete data we have
                })
                .catch(error => {
                    console.error("Error fetching on-demand G-Details for overlays:", error);
                    overlayDebugLog("Error fetching on-demand details. Displaying UI with existing placeDetails from JSON.");
                    updateGoogleUIData(shop.placeDetails || null); // Still try to update UI with what we already had
                });
        } else {
            // No GoogleProfileID, or getPlaceDetailsClient not available
            // Update UI with whatever is in shop.placeDetails (from JSON, enriched by background job)
            overlayDebugLog("No GoogleProfileID or getPlaceDetailsClient unavailable for overlays. Using existing placeDetails from JSON.");
            updateGoogleUIData(shop.placeDetails || null);
        }
        setupSocialTabs(); // Initialize or re-initialize tab states
    }
}

// ... (other functions like setupSocialTabs) ...
/**
 * Sets up the click listeners and default state for social overlay tabs.
 */
function setupSocialTabs() {
    const dom = AppState.dom;
    if (!dom.socialOverlayTabs || !dom.detailsOverlaySocialElement) return;

    const tabButtons = dom.socialOverlayTabs.querySelectorAll('.social-tab-button');
    const tabContents = dom.detailsOverlaySocialElement.querySelectorAll('.social-tab-content');
    let defaultTabTargetId = 'social-photos-panel'; // Default or choose based on available data

    // Logic to select default tab can be added here...

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanelId = button.dataset.tabTarget;
            tabButtons.forEach(btn => { btn.classList.remove('active-social-tab'); btn.setAttribute('aria-selected', 'false'); });
            button.classList.add('active-social-tab'); button.setAttribute('aria-selected', 'true');
            tabContents.forEach(panel => panel.classList.toggle('hidden', panel.id !== targetPanelId));

            // Re-parse/process SDKs on tab switch
            if (targetPanelId === 'social-facebook-panel' && typeof FB !== 'undefined' && FB.XFBML) setTimeout(() => FB.XFBML.parse(), 50);
            if (targetPanelId === 'social-instagram-panel' && typeof window.instgrm !== 'undefined' && window.instgrm.Embeds) setTimeout(() => window.instgrm.Embeds.process(), 100);
        });
        // Set initial active state based on defaultTabTargetId
        const isActive = button.dataset.tabTarget === defaultTabTargetId;
        button.classList.toggle('active-social-tab', isActive);
        button.setAttribute('aria-selected', isActive.toString());
    });
    tabContents.forEach(panel => panel.classList.toggle('hidden', panel.id !== defaultTabTargetId));
}