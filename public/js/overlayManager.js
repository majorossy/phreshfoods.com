// public/js/overlayManager.js
'use strict';

/**
 * Opens a specified overlay panel with a transition.
 * @param {HTMLElement} overlayElement - The overlay DOM element.
 */
function openOverlay(overlayElement) {
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
    if (!overlayElement) return;
    overlayElement.classList.remove('is-open');
    overlayElement.classList.add('hidden'); // Use 'hidden' to ensure display:none

    // Check if any modal/overlay is still open
    if (!AppState.dom.detailsOverlayShopElement?.classList.contains('is-open') &&
        !AppState.dom.detailsOverlaySocialElement?.classList.contains('is-open') &&
        !document.getElementById('initialSearchModal')?.classList.contains('modal-open')) {
        document.body.classList.remove('modal-active');
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
async function openClickedShopOverlays(shop) {
    if (!shop) { console.error("openClickedShopOverlays: Shop data is null."); return; }
    AppState.currentShopForDirections = shop;
    const dom = AppState.dom;

    // --- Populate & Open Shop Details Overlay (Right) ---
    if (dom.detailsOverlayShopElement) {
        openOverlay(dom.detailsOverlayShopElement);
        dom.detailsOverlayShopElement.scrollTop = 0;
        if (dom.shopDetailNameElement) dom.shopDetailNameElement.textContent = shop.Name || 'Details';
        if (dom.shopImageGallery) {
            dom.shopImageGallery.innerHTML = ''; // Clear
            [shop.ImageOne, shop.ImageTwo, shop.ImageThree].filter(Boolean).forEach(t => {
                if (t.trim()) {
                    const c = document.createElement('div'); c.className = 'gallery-image-container';
                    const i = document.createElement('img'); i.src = `/images/${t.trim()}`; i.alt = `${escapeHTML(shop.Name)} image`; i.className = 'gallery-image'; i.loading = 'lazy'; i.onerror = function() { this.parentElement.innerHTML = '<p class="text-xs">Missing</p>'; }; c.appendChild(i); dom.shopImageGallery.appendChild(c);
                }
            });
             if(!dom.shopImageGallery.innerHTML) dom.shopImageGallery.innerHTML = '<p class="text-sm p-4 text-center">No photos.</p>';
        }
        if (dom.shopProductIconsContainer && typeof generateProductIconsHTML === 'function') dom.shopProductIconsContainer.innerHTML = generateProductIconsHTML(shop);
        if(dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.remove('hidden');
        if(dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.add('hidden');
        if(dom.directionsPanel) dom.directionsPanel.innerHTML = "";
        if (dom.shopOpeningHoursContainer) dom.shopOpeningHoursContainer.innerHTML = '<p class="text-sm p-2 text-center">Loading hours...</p>';
    }

    // --- Populate & Open Social Media Overlay (Left) ---
    if (dom.detailsOverlaySocialElement) {
        openOverlay(dom.detailsOverlaySocialElement);
        dom.detailsOverlaySocialElement.scrollTop = 0;
        ['socialLinksContainer', 'twitterTimelineContainer', 'instagramFeedContainer', 'socialOverlayReviewsContainer', 'socialOverlayGooglePhotosContainer']
            .forEach(key => { if(dom[key]) dom[key].innerHTML = `<p class="text-sm p-4 text-center">Loading...</p>`; });

        if (dom.socialLinksContainer && typeof generateFacebookPagePluginHTML === 'function') dom.socialLinksContainer.innerHTML = shop.FacebookPageID ? generateFacebookPagePluginHTML(shop.FacebookPageID, shop.Name) : '<p class="text-sm p-4 text-center">No Facebook.</p>';
        if (dom.twitterTimelineContainer && typeof displayTwitterTimeline === 'function') displayTwitterTimeline(shop.TwitterHandle, dom.twitterTimelineContainer);
        if (dom.instagramFeedContainer && typeof populateInstagramTab === 'function') populateInstagramTab(shop, dom.instagramFeedContainer);

        // Fetch/Display Google Data
        const updateGoogleUIData = (placeData) => {
            if (dom.socialOverlayReviewsContainer && typeof displayShopReviews === 'function') displayShopReviews(placeData, dom.socialOverlayReviewsContainer);
            if (dom.socialOverlayGooglePhotosContainer && typeof displayGooglePlacePhotos === 'function') displayGooglePlacePhotos(placeData, dom.socialOverlayGooglePhotosContainer);
            if (dom.shopOpeningHoursContainer && typeof displayOpeningHours === 'function') displayOpeningHours(placeData, dom.shopOpeningHoursContainer);
        };

        if (shop.GoogleProfileID && typeof getPlaceDetailsClient === 'function') {
            if (!shop.placeDetails || !shop.placeDetails.opening_hours || !shop.placeDetails.reviews) {
                getPlaceDetailsClient(shop.GoogleProfileID, 'name,rating,user_ratings_total,reviews,photos,opening_hours,business_status,url')
                    .then(place => { shop.placeDetails = place || shop.placeDetails || {}; updateGoogleUIData(shop.placeDetails); })
                    .catch(error => { console.error("Error fetching G-Details:", error); updateGoogleUIData(shop.placeDetails || {}); });
            } else { updateGoogleUIData(shop.placeDetails); }
        } else { updateGoogleUIData(null); }
        setupSocialTabs(); // Ensure tabs are set correctly
    }
}

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