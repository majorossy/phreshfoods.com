'use strict';

const PRODUCT_ICONS_CONFIG = {
    'beef': { csvHeader: 'beef', name: 'Beef', icon_available: 'beef_1.jpg', icon_unavailable: 'beef_0.jpg' },
    'pork': { csvHeader: 'pork', name: 'Pork', icon_available: 'pork_1.jpg', icon_unavailable: 'pork_0.jpg' },
    'lamb': { csvHeader: 'lamb', name: 'Lamb', icon_available: 'lamb_1.jpg', icon_unavailable: 'lamb_0.jpg' },
    'chicken': { csvHeader: 'chicken', name: 'Chicken', icon_available: 'chicken_1.jpg', icon_unavailable: 'chicken_0.jpg' },
    'turkey': { csvHeader: 'turkey', name: 'Turkey', icon_available: 'turkey_1.jpg', icon_unavailable: 'turkey_0.jpg' },
    'duck': { csvHeader: 'duck', name: 'Duck', icon_available: 'duck_1.jpg', icon_unavailable: 'duck_0.jpg' },
    'eggs': { csvHeader: 'eggs', name: 'Eggs', icon_available: 'eggs_1.jpg', icon_unavailable: 'eggs_0.jpg' },
    'corn': { csvHeader: 'corn', name: 'Corn', icon_available: 'corn_1.jpg', icon_unavailable: 'corn_0.jpg' },
    'carrots': { csvHeader: 'carrots', name: 'Carrots', icon_available: 'carrots_1.jpg', icon_unavailable: 'carrots_0.jpg' },
    'garlic': { csvHeader: 'garlic', name: 'Garlic', icon_available: 'garlic_1.jpg', icon_unavailable: 'garlic_0.jpg' },
    'onions': { csvHeader: 'onions', name: 'Onions', icon_available: 'onions_1.jpg', icon_unavailable: 'onions_0.jpg' },
    'potatoes': { csvHeader: 'potatoes', name: 'Potatoes', icon_available: 'potatoes_1.jpg', icon_unavailable: 'potatoes_0.jpg' },
    'lettus': { csvHeader: 'lettus', name: 'Lettuce', icon_available: 'lettus_1.jpg', icon_unavailable: 'lettus_0.jpg' },
    'spinach': { csvHeader: 'spinach', name: 'Spinach', icon_available: 'spinach_1.jpg', icon_unavailable: 'spinach_0.jpg' },
    'squash': { csvHeader: 'squash', name: 'Squash', icon_available: 'squash_1.jpg', icon_unavailable: 'squash_0.jpg' },
    'tomatoes': { csvHeader: 'tomatoes', name: 'Tomatoes', icon_available: 'tomatoes_1.jpg', icon_unavailable: 'tomatoes_0.jpg' },
    'peppers': { csvHeader: 'peppers', name: 'Peppers', icon_available: 'peppers_1.jpg', icon_unavailable: 'peppers_0.jpg' },
    'cucumbers': { csvHeader: 'cucumbers', name: 'Cucumbers', icon_available: 'cucumbers_1.jpg', icon_unavailable: 'cucumbers_0.jpg' },
    'zucchini': { csvHeader: 'zucchini', name: 'Zucchini', icon_available: 'zucchini_1.jpg', icon_unavailable: 'zucchini_0.jpg' },
    'strawberries': { csvHeader: 'strawberries', name: 'Strawberries', icon_available: 'strawberries_1.jpg', icon_unavailable: 'strawberries_0.jpg' },
    'blueberries': { csvHeader: 'blueberries', name: 'Blueberries', icon_available: 'blueberries_1.jpg', icon_unavailable: 'blueberries_0.jpg' },
};
const FILTERABLE_PRODUCT_ATTRIBUTES = Object.keys(PRODUCT_ICONS_CONFIG);

document.addEventListener('DOMContentLoaded', () => {
    if (!window.AppState || !window.AppState.dom) {
        console.error("AppState.dom not initialized by main.js! Some uiLogic event listeners may not attach.");
        // uiLogic depends on AppState.dom being populated by main.js's DOMContentLoaded.
        // If this script runs first, some of these will be null.
        // It's generally okay if main.js initializes them as its DOMContentLoaded should fire.
    }

    // Ensure references are from AppState.dom which should be populated by main.js
    const uiDom = AppState.dom;

    if (uiDom.productFilterToggleElement && uiDom.productFilterDropdownElement && uiDom.productFilterCheckboxesContainer && uiDom.resetProductFiltersButton && uiDom.activeFilterCountElement) {
        populateProductFilterDropdown();
        uiDom.productFilterToggleElement.addEventListener('click', (e) => { /* ... as before ... */
            e.stopPropagation(); uiDom.productFilterDropdownElement.classList.toggle('hidden');
        });
        uiDom.resetProductFiltersButton.addEventListener('click', () => { /* ... as before, using AppState.activeProductFilters ... */
            FILTERABLE_PRODUCT_ATTRIBUTES.forEach(attr => { AppState.activeProductFilters[attr] = false; const cb = uiDom.productFilterCheckboxesContainer.querySelector(`input[name="${attr}"]`); if (cb) cb.checked = false; });
            updateActiveFilterCountDisplay(); if (typeof handleSearch === 'function') handleSearch(); uiDom.productFilterDropdownElement.classList.add('hidden');
        });
        document.body.addEventListener('click', (e) => { /* ... as before ... */
            if (uiDom.productFilterDropdownElement && !uiDom.productFilterDropdownElement.classList.contains('hidden') && !uiDom.productFilterToggleElement.contains(e.target) && !uiDom.productFilterDropdownElement.contains(e.target)) {
                uiDom.productFilterDropdownElement.classList.add('hidden');
            }
        });
    }

    if (uiDom.getShopDirectionsButton) {
        uiDom.getShopDirectionsButton.addEventListener('click', () => {
            if (AppState.currentShopForDirections) handleGetDirections(AppState.currentShopForDirections);
            else { console.error("No shop selected for overlay directions."); alert("Please select a shop first."); }
        });
    }
    if (uiDom.clearShopDirectionsButton) {
        uiDom.clearShopDirectionsButton.addEventListener('click', () => {
            if (typeof clearDirections === 'function') clearDirections();
        });
    }
    if (uiDom.closeDetailsOverlaySocialButton) uiDom.closeDetailsOverlaySocialButton.addEventListener('click', closeClickedShopOverlays);
    if (uiDom.closeDetailsOverlayShopButton) uiDom.closeDetailsOverlayShopButton.addEventListener('click', closeClickedShopOverlays);

    if (uiDom.socialOverlayTabs && uiDom.detailsOverlaySocialElement) {
        const tabButtons = uiDom.socialOverlayTabs.querySelectorAll('.social-tab-button');
        const tabContents = uiDom.detailsOverlaySocialElement.querySelectorAll('.social-tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => { /* ... tab switching logic ... */
                const targetPanelId = button.dataset.tabTarget;
                tabButtons.forEach(btn => { btn.classList.remove('active-social-tab'); btn.setAttribute('aria-selected', 'false'); });
                button.classList.add('active-social-tab'); button.setAttribute('aria-selected', 'true');
                tabContents.forEach(panel => {
                    panel.classList.toggle('hidden', panel.id !== targetPanelId);
                    if (panel.id === targetPanelId && !panel.classList.contains('hidden')) { /* FB/IG parse */
                        if (targetPanelId === 'social-facebook-panel' && typeof FB !== 'undefined' && FB.XFBML) { if (uiDom.socialLinksContainer?.querySelector('.fb-page')) setTimeout(() => FB.XFBML.parse(uiDom.socialLinksContainer), 50);}
                        if (targetPanelId === 'social-instagram-panel' && typeof window.instgrm !== 'undefined' && window.instgrm.Embeds) { if (uiDom.instagramFeedContainer) setTimeout(() => window.instgrm.Embeds.process(), 100); }
                    }
                });
                if (uiDom.detailsOverlaySocialElement) uiDom.detailsOverlaySocialElement.scrollTop = 0;
            });
        });
    }
});

function populateProductFilterDropdown() {
    // Use AppState.dom consistently
    if (!AppState.dom.productFilterCheckboxesContainer || !FILTERABLE_PRODUCT_ATTRIBUTES) return;
    AppState.dom.productFilterCheckboxesContainer.innerHTML = '';
    AppState.activeProductFilters = AppState.activeProductFilters || {};

    FILTERABLE_PRODUCT_ATTRIBUTES.forEach(attrKey => {
        const attributeConfig = PRODUCT_ICONS_CONFIG[attrKey];
        const displayName = attributeConfig ? attributeConfig.name : (attrKey.charAt(0).toUpperCase() + attrKey.slice(1));
        const iconFileName = attributeConfig ? attributeConfig.icon_available : null;
        AppState.activeProductFilters[attrKey] = AppState.activeProductFilters[attrKey] || false;

        const label = document.createElement('label');
        label.className = 'block hover:bg-gray-100 p-1 rounded transition-colors duration-150 flex items-center cursor-pointer';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.name = attrKey;
        checkbox.className = 'form-checkbox h-3 w-3 text-red-600 border-gray-300 rounded focus:ring-red-500 mr-2';
        checkbox.checked = AppState.activeProductFilters[attrKey];
        checkbox.addEventListener('change', (e) => {
            AppState.activeProductFilters[attrKey] = e.target.checked;
            updateActiveFilterCountDisplay();
            if (typeof handleSearch === 'function') handleSearch(); // handleSearch in main.js
        });
        label.appendChild(checkbox);
        if (iconFileName) {
            const iconImg = document.createElement('img');
            iconImg.src = `images/icons/${iconFileName}`; iconImg.alt = `${displayName} icon`;
            iconImg.className = 'w-4 h-4 object-contain mr-1.5';
            label.appendChild(iconImg);
        }
        label.appendChild(document.createTextNode(displayName));
        AppState.dom.productFilterCheckboxesContainer.appendChild(label);
    });
    updateActiveFilterCountDisplay();
}

function updateActiveFilterCountDisplay() {
    if (!AppState.dom.activeFilterCountElement || !AppState.dom.productFilterToggleElement) return;
    const count = Object.values(AppState.activeProductFilters).filter(isActive => isActive).length;
    // ... (rest of the logic is the same as before)
    if (count > 0) {
        AppState.dom.activeFilterCountElement.textContent = `(${count})`;
        AppState.dom.activeFilterCountElement.classList.remove('hidden'); AppState.dom.activeFilterCountElement.classList.add('visible');
        AppState.dom.productFilterToggleElement.classList.add('filters-active');
    } else {
        AppState.dom.activeFilterCountElement.textContent = '';
        AppState.dom.activeFilterCountElement.classList.add('hidden'); AppState.dom.activeFilterCountElement.classList.remove('visible');
        AppState.dom.productFilterToggleElement.classList.remove('filters-active');
    }
}

function openOverlay(overlayElement) {
    if (!overlayElement) return;
    overlayElement.classList.remove('hidden'); overlayElement.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function closeOverlay(overlayElement) {
    if (!overlayElement) return;
    overlayElement.classList.remove('is-open'); overlayElement.classList.add('hidden');
    if (!AppState.dom.detailsOverlayShopElement?.classList.contains('is-open') &&
        !AppState.dom.detailsOverlaySocialElement?.classList.contains('is-open')) {
        document.body.style.overflow = '';
    }
}

function closeClickedShopOverlays() {
    let anOverlayWasOpen = false;
    if (AppState.dom.detailsOverlayShopElement?.classList.contains('is-open')) {
        closeOverlay(AppState.dom.detailsOverlayShopElement); anOverlayWasOpen = true;
    }
    if (AppState.dom.detailsOverlaySocialElement?.classList.contains('is-open')) {
        closeOverlay(AppState.dom.detailsOverlaySocialElement); anOverlayWasOpen = true;
    }
    if (anOverlayWasOpen) {
        if (typeof infowindow !== 'undefined' && infowindow?.close === 'function') infowindow.close();
        AppState.currentShopForDirections = null;
        const placeholders = { /* ... as before ... */
            socialLinksContainer: 'Loading Facebook feed...', twitterTimelineContainer: 'Loading Twitter feed...', instagramFeedContainer: 'Instagram content will load here.',
            socialOverlayReviewsContainer: 'Loading reviews...', socialOverlayGooglePhotosContainer: 'Loading Google Photos...'
        };
        for (const key in placeholders) { /* ... as before, using AppState.dom[key] ... */
            if (AppState.dom[key]) { AppState.dom[key].innerHTML = `<p class="text-sm text-gray-500 p-4 text-center">${placeholders[key]}</p>`;
                if(AppState.dom[key].dataset) { if(key === 'socialLinksContainer') AppState.dom[key].dataset.currentPageId = ''; /* etc. */ }
            }
        }
    }
}

function getStarRatingHTML(ratingStringOrNumber, reviewCount) {
    const rating = parseFloat(ratingStringOrNumber);
    if (ratingStringOrNumber === "N/A" || isNaN(rating) || rating < 0 || rating > 5) return `<div class="flex items-center text-sm text-gray-500">No rating available</div>`;
    const numRating = parseFloat(rating.toFixed(1)); const displayRatingValue = numRating.toFixed(1);
    const roundedForStarDisplay = Math.round(numRating);
    const starSVGPath = "M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z";
    let starsHTML = `<span class="inline-flex items-center">`;
    for (let i = 0; i < 5; i++) starsHTML += `<svg class="w-4 h-4 fill-current ${i < roundedForStarDisplay ? 'text-yellow-400' : 'text-gray-300'}" viewBox="0 0 20 20"><path d="${starSVGPath}"/></svg>`;
    starsHTML += `</span>`;
    let reviewCountHTML = (typeof reviewCount === 'number' && reviewCount >= 0) ? `<span class="text-gray-500 group-hover:text-gray-700 group-hover:underline">(${reviewCount.toLocaleString()})</span>` : '';
    return `<div class="flex items-center gap-x-1 text-sm"><span class="font-semibold text-gray-700">${displayRatingValue}</span>${starsHTML}${reviewCountHTML}</div>`;
}

function getStarsVisualHTML(ratingStringOrNumber, starSizeClass = 'w-5 h-5') {
    const rating = parseFloat(ratingStringOrNumber);
    if (ratingStringOrNumber === "N/A" || isNaN(rating) || rating < 0 || rating > 5) return '<span class="text-sm text-gray-500">No rating</span>';
    const roundedForStarDisplay = Math.round(rating);
    const starSVGPath = "M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z";
    let starsHTML = `<span class="inline-flex items-center">`;
    for (let i = 0; i < 5; i++) starsHTML += `<svg class="${starSizeClass} fill-current ${i < roundedForStarDisplay ? 'text-yellow-400' : 'text-gray-300'}" viewBox="0 0 20 20"><path d="${starSVGPath}"/></svg>`;
    starsHTML += `</span>`; return starsHTML;
}

function generateFacebookPagePluginHTML(pageId, pageName) {
    if (!pageId) return '<!-- Error: Facebook Page ID missing. -->';
    const facebookPageLink = `https://www.facebook.com/${pageId}/`; const displayName = pageName || pageId;
    return `<div class="fb-page" data-href="${facebookPageLink}" data-tabs="timeline" data-width="100%" data-height="100%" data-use-container-width="true" data-small-header="true" data-adapt-container-width="true" data-hide-cover="true" data-show-facepile="false"><blockquote cite="${facebookPageLink}" class="fb-xfbml-parse-ignore"><a href="${facebookPageLink}">${displayName}</a></blockquote></div>`;
}

function displayTwitterTimeline(twitterHandle, containerElement) {
    if (!containerElement) return; containerElement.innerHTML = '';
    if (!twitterHandle?.trim()) { containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Twitter handle configured.</p>'; return; }
    const cleanHandle = twitterHandle.replace('@', '').trim();
    if (!cleanHandle) { containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">Invalid Twitter handle.</p>'; return; }
    containerElement.innerHTML = `<p class="text-sm text-gray-400 p-4">Loading Twitter feed for @${cleanHandle}...</p>`;
    if (typeof twttr?.widgets?.createTimeline !== 'function') { containerElement.innerHTML = '<p class="text-sm text-red-500 p-4">Twitter embedding script not available.</p>'; return; }
    try {
        const promise = twttr.widgets.createTimeline({ sourceType: 'profile', screenName: cleanHandle }, containerElement, { theme: 'light', chrome: 'noheader nofooter noborders noscrollbar transparent', tweetLimit: 10 });
        if (!promise?.then) { if (containerElement.innerHTML.includes("Loading")) containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Twitter widget creation may have failed.</p>`; return; }
        promise.then(el => { if (!el) containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Could not embed Twitter for @${cleanHandle}.</p>`; else { const iframe = containerElement.querySelector('iframe'); if (iframe) { iframe.style.height = '100%'; iframe.style.minHeight = '400px'; }}
        }).catch(e => { console.error(`Error Twitter @${cleanHandle}:`, e); containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Error embedding Twitter.</p>`; });
    } catch (error) { console.error(`Sync error Twitter @${cleanHandle}:`, error); containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Failed to init Twitter.</p>`; }
}

function displayGooglePlacePhotos(placeDetails, containerElement) {
    if (!containerElement) return; containerElement.innerHTML = '';
    if (placeDetails?.photos?.length > 0) {
        placeDetails.photos.slice(0, 9).forEach(photo => {
            const imgContainer = document.createElement('div'); imgContainer.className = 'gallery-image-container google-photo-item';
            const img = document.createElement('img'); img.src = photo.getUrl({ maxWidth: 400, maxHeight: 300 }); img.alt = `Photo of ${placeDetails.name || 'shop'}`; img.className = 'gallery-image';
            img.onerror = function() { this.parentElement.innerHTML = '<p class="text-xs text-gray-500 p-2">Image unavailable</p>'; };
            imgContainer.appendChild(img); containerElement.appendChild(imgContainer);
        });
    } else { containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 col-span-full text-center">No Google photos found.</p>'; }
}

async function openClickedShopOverlays(shop) {
    if (!shop) { console.error("Shop data is null."); return; }
    AppState.currentShopForDirections = shop;
    const dom = AppState.dom; // Alias for brevity

    if (dom.detailsOverlayShopElement) {
        openOverlay(dom.detailsOverlayShopElement); dom.detailsOverlayShopElement.scrollTop = 0;
        try {
            if (dom.shopDetailNameElement) dom.shopDetailNameElement.textContent = shop.Name || 'N/A';
            if (dom.shopImageGallery) {
                dom.shopImageGallery.innerHTML = '';
                const imageFilenames = [shop.ImageOne, shop.ImageTwo, shop.ImageThree].filter(Boolean);
                if (imageFilenames.length > 0) imageFilenames.forEach(f => { const t = f.trim(); if(t){const c=document.createElement('div');c.className='gallery-image-container';const i=document.createElement('img');i.src=`images/${t}`;i.alt=`${shop.Name||'Shop'} img`;i.className='gallery-image';i.onerror=function(){this.parentElement.innerHTML='<p class="text-xs text-gray-500 p-2">Img missing</p>';};c.appendChild(i);dom.shopImageGallery.appendChild(c);}});
                else dom.shopImageGallery.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center col-span-full">No listing photos.</p>';
            }
            if (dom.shopProductIconsContainer) dom.shopProductIconsContainer.innerHTML = generateProductIconsHTML(shop);
            if (dom.shopOpeningHoursContainer) dom.shopOpeningHoursContainer.innerHTML = '<p class="text-sm text-gray-500 p-2">Loading hours...</p>';
            if(dom.getShopDirectionsButton) dom.getShopDirectionsButton.classList.remove('hidden');
            if(dom.clearShopDirectionsButton) dom.clearShopDirectionsButton.classList.add('hidden');
            if(dom.directionsPanel) dom.directionsPanel.innerHTML = "";
        } catch (e) { console.error("Error populating shop overlay:", e); }
    }

    if (dom.detailsOverlaySocialElement) {
        openOverlay(dom.detailsOverlaySocialElement); dom.detailsOverlaySocialElement.scrollTop = 0;
        try {
            // Loading states
            ['socialLinksContainer', 'twitterTimelineContainer', 'instagramFeedContainer', 'socialOverlayReviewsContainer', 'socialOverlayGooglePhotosContainer'].forEach(key => {
                if(dom[key]) dom[key].innerHTML = `<p class="text-sm text-gray-500 p-4 text-center">Loading ${key.replace('Container', '').replace('socialOverlay', '').replace(/([A-Z])/g, ' $1').trim()}...</p>`;
            });

            if (dom.socialLinksContainer) { /* Facebook */ shop.FacebookPageID ? (dom.socialLinksContainer.innerHTML = generateFacebookPagePluginHTML(shop.FacebookPageID, shop.Name), dom.socialLinksContainer.dataset.currentPageId=shop.FacebookPageID) : dom.socialLinksContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Facebook Page.</p>';}
            if (dom.twitterTimelineContainer) { /* Twitter */ shop.TwitterHandle ? (displayTwitterTimeline(shop.TwitterHandle, dom.twitterTimelineContainer), dom.twitterTimelineContainer.dataset.currentTwitterHandle=shop.TwitterHandle) : dom.twitterTimelineContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Twitter Handle.</p>';}
            if (dom.instagramFeedContainer) populateInstagramTab(shop, dom.instagramFeedContainer);

            if (shop.GoogleProfileID && typeof placesService !== 'undefined') { // placesService from mapLogic.js
                const fields = ['name', 'rating', 'user_ratings_total', 'reviews', 'photos', 'opening_hours', 'utc_offset_minutes', 'business_status', 'url'];
                const updateGoogleUI = (placeData) => {
                    if(dom.socialOverlayReviewsContainer) displayShopReviews(placeData, dom.socialOverlayReviewsContainer);
                    if(dom.socialOverlayGooglePhotosContainer) displayGooglePlacePhotos(placeData, dom.socialOverlayGooglePhotosContainer);
                    if(dom.shopOpeningHoursContainer) displayOpeningHours(placeData, dom.shopOpeningHoursContainer);
                };
                if (!shop.placeDetails || !shop.placeDetails.opening_hours) {
                    placesService.getDetails({ placeId: shop.GoogleProfileID, fields }, (place, status) => {
                        shop.placeDetails = (status === google.maps.places.PlacesServiceStatus.OK && place) ? place : (shop.placeDetails || {});
                        updateGoogleUI(shop.placeDetails);
                        if (status !== google.maps.places.PlacesServiceStatus.OK) console.warn(`Places API fail ${shop.Name}: ${status}`);
                    });
                } else { updateGoogleUI(shop.placeDetails); }
            } else { /* No GoogleProfileID, clear loading for Google sections */
                if(dom.socialOverlayReviewsContainer) displayShopReviews(null, dom.socialOverlayReviewsContainer);
                if(dom.socialOverlayGooglePhotosContainer) displayGooglePlacePhotos(null, dom.socialOverlayGooglePhotosContainer);
                if(dom.shopOpeningHoursContainer) displayOpeningHours(null, dom.shopOpeningHoursContainer);
            }
            // Tab default logic
            if(dom.socialOverlayTabs && dom.detailsOverlaySocialElement) { /* ... tab selection logic as before ... */
                let defaultTab = 'social-photos-panel'; if (shop.FacebookPageID && !shop.GoogleProfileID) defaultTab = 'social-facebook-panel';
                // Refine this further as needed.
                const tabBtns = dom.socialOverlayTabs.querySelectorAll('.social-tab-button');
                const tabCnts = dom.detailsOverlaySocialElement.querySelectorAll('.social-tab-content');
                let defaultActive = false;
                tabBtns.forEach(b => { if(b.dataset.tabTarget===defaultTab){b.classList.add('active-social-tab');b.setAttribute('aria-selected','true');defaultActive=true;}else{b.classList.remove('active-social-tab');b.setAttribute('aria-selected','false');}});
                if(!defaultActive && tabBtns.length>0){tabBtns[0].classList.add('active-social-tab');tabBtns[0].setAttribute('aria-selected','true');defaultTab=tabBtns[0].dataset.tabTarget;}
                tabCnts.forEach(p => p.classList.toggle('hidden', p.id !== defaultTab));
                // FB/IG parse
                if(defaultTab==='social-facebook-panel' && FB?.XFBML && dom.socialLinksContainer?.querySelector('.fb-page')) setTimeout(()=>FB.XFBML.parse(dom.socialLinksContainer),100);
                if(defaultTab==='social-instagram-panel' && instgrm?.Embeds && dom.instagramFeedContainer) setTimeout(()=>instgrm.Embeds.process(),150);
            }
        } catch (e) { console.error("Error populating social overlay:", e); }
    }
}

function displayOpeningHours(placeDetails, containerElement) {
    if (!containerElement) return;
    // ... (Restoring full logic, including error states)
    if (placeDetails?.opening_hours?.weekday_text) {
        let hoursHTML = '<ul class="opening-hours-list space-y-1 text-sm text-gray-700">';
        if (typeof placeDetails.opening_hours.isOpen === 'function') {
            const isOpenNow = placeDetails.opening_hours.isOpen();
            if (isOpenNow !== undefined) hoursHTML = `<p class="text-sm font-semibold mb-2 ${isOpenNow ? 'text-green-600' : 'text-red-600'}">${isOpenNow ? 'Open now' : 'Closed now'}</p>` + hoursHTML;
        } else if (placeDetails.business_status === "OPERATIONAL" && placeDetails.opening_hours.open_now !== undefined) {
            hoursHTML = `<p class="text-sm font-semibold mb-2 ${placeDetails.opening_hours.open_now ? 'text-green-600' : 'text-red-600'}">${placeDetails.opening_hours.open_now ? 'Open now' : 'Closed now'}</p>` + hoursHTML;
        }
        placeDetails.opening_hours.weekday_text.forEach(daySchedule => {
            const parts = daySchedule.split(/:\s*(.*)/s); const day = parts[0]; const hours = parts[1]?.trim() || 'Closed';
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const isTodayClass = (day.toLowerCase() === today.toLowerCase()) ? 'font-bold text-blue-600' : '';
            hoursHTML += `<li class="flex justify-between ${isTodayClass}"><span>${day}:</span><span class="text-right">${hours}</span></li>`;
        });
        hoursHTML += '</ul>'; containerElement.innerHTML = hoursHTML;
    } else if (placeDetails?.business_status && placeDetails.business_status !== "OPERATIONAL") {
        let statusMessage = "Hours info not available.";
        if (placeDetails.business_status === "CLOSED_TEMPORARILY") statusMessage = "Temporarily Closed";
        else if (placeDetails.business_status === "CLOSED_PERMANENTLY") statusMessage = "Permanently Closed";
        containerElement.innerHTML = `<p class="text-sm text-red-500 font-semibold text-center p-2">${statusMessage}</p>`;
    } else { containerElement.innerHTML = '<p class="text-sm text-gray-500 text-center p-2">Hours info not available.</p>'; }
}

function displayShopReviews(placeDetails, containerElement) {
    if (!containerElement) return; containerElement.innerHTML = '';
    let summaryHTML = ''; let reviewDistributionHTML = '';
    // ... (Restoring summaryHTML and reviewDistributionHTML generation if placeDetails exists) ...
    if (placeDetails?.rating != null && placeDetails?.user_ratings_total != null) {
        const ratingValue = placeDetails.rating.toFixed(1); const totalReviews = placeDetails.user_ratings_total.toLocaleString(); const starsVisual = getStarsVisualHTML(placeDetails.rating, 'w-5 h-5');
        summaryHTML = `<div class="place-review-summary p-4 mb-4 border-b border-gray-200"><div class="flex items-center gap-x-3 sm:gap-x-4"><div class="flex-shrink-0"><p class="text-4xl sm:text-5xl font-bold text-gray-800">${ratingValue}</p></div><div class="flex flex-col"><div class="stars-container">${starsVisual}</div><p class="text-xs sm:text-sm text-gray-600 mt-1">${totalReviews} reviews</p></div></div></div>`;
        if (placeDetails.reviews?.length > 0) { /* Star distribution bars */
            const starCounts={5:0,4:0,3:0,2:0,1:0};let sTotal=0; placeDetails.reviews.forEach(r=>{const R=Math.round(r.rating); if(R>=1 && R<=5){starCounts[R]++;sTotal++;}});
            if(sTotal>0){reviewDistributionHTML='<div class="review-distribution-bars px-4 mb-4 text-sm">'; for(let i=5;i>=1;i--){const c=starCounts[i]; const p=(c/sTotal)*100; reviewDistributionHTML+=`<div class="flex items-center gap-x-2 mb-1"><span class="w-2 text-right text-gray-600">${i}</span><div class="flex-grow bg-gray-200 rounded-full h-2.5"><div class="bg-yellow-400 h-2.5 rounded-full" style="width: ${p.toFixed(1)}%;"></div></div></div>`;} reviewDistributionHTML+='</div>';}
        }
    }
    // ... (Restoring individual reviews list generation) ...
    if (placeDetails?.reviews?.length > 0) {
        const ul = document.createElement('ul'); ul.className = 'space-y-3 px-4';
        placeDetails.reviews.slice(0,5).forEach(r => { const li=document.createElement('li');li.className='p-3 bg-gray-50 rounded-md shadow-sm'; const stars=getStarRatingHTML(r.rating);
            li.innerHTML=`<div class="flex items-center mb-1">${r.profile_photo_url?`<img src="${r.profile_photo_url.replace(/=s\d+/,'=s40')}" class="w-8 h-8 rounded-full mr-2">`:'<div class="w-8 h-8 rounded-full mr-2 bg-gray-200 flex items-center justify-center"><svg class="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clip-rule="evenodd"></path></svg></div>'}<strong class="text-sm text-gray-700 truncate">${r.author_name}</strong><span class="ml-auto text-xs text-gray-500 whitespace-nowrap">${r.relative_time_description}</span></div><div class="review-stars-individual mb-1">${stars}</div><p class="text-xs text-gray-600 leading-relaxed line-clamp-3 hover:line-clamp-none cursor-pointer">${r.text||''}</p>`;
            const p=li.querySelector('p.text-xs'); if(p)p.addEventListener('click',()=>p.classList.toggle('line-clamp-3')); ul.appendChild(li);});
        containerElement.innerHTML = summaryHTML+reviewDistributionHTML; containerElement.appendChild(ul);
        if(placeDetails.reviews.length > 5 || placeDetails.url) {/* Add "View more" link */}
    } else { /* No individual reviews to show */
        let content=summaryHTML+reviewDistributionHTML; containerElement.innerHTML=content ? (content+'<p class="text-sm text-gray-500 p-4 text-center">No Google reviews shown.</p>') : '<p class="text-sm text-gray-500 p-4 text-center">No Google reviews or rating data.</p>';
    }
}


function generateShopContentHTML(shop, context = 'card') {
    if (!shop) return '<p>Shop data unavailable.</p>';
    let actualImageUrl;
    const placeholderText = encodeURIComponent(shop.Name.split(' ').slice(0, 2).join(' ') || 'Farm Stand');
    const fallbackImageUrlCard = `https://placehold.co/400x250/E0E0E0/757575?text=${placeholderText}&font=inter`;
    const fallbackImageUrlBubble = `https://placehold.co/280x150/E0E0E0/757575?text=${placeholderText}&font=inter`;

    actualImageUrl = (shop.ImageOne && shop.ImageOne.trim()) ? `images/${shop.ImageOne.trim()}` : (context === 'card' ? fallbackImageUrlCard : fallbackImageUrlBubble);

    let finalImageHTML = '';
    if (context === 'card') {
        finalImageHTML = `<div class="aspect-w-16 aspect-h-9 sm:aspect-h-7"><img class="w-full h-full object-cover" loading="lazy" src="${actualImageUrl}" alt="Image of ${shop.Name}" onerror="this.onerror=null; this.src='${fallbackImageUrlCard}';"></div>`;
    } else if (context === 'infowindow' && shop.ImageOne && shop.ImageOne.trim()) {
        finalImageHTML = `<img class="w-full h-auto object-cover rounded-t-sm mb-1" style="max-height: 150px;" src="${actualImageUrl}" alt="Image of ${shop.Name}" onerror="this.style.display='none'; this.onerror=null; this.src='${fallbackImageUrlBubble}';">`; // Added fallback to bubble placeholder on error for infowindow too
    }

    const ratingSource = shop.placeDetails;
    let starsAndRatingHTML = getStarRatingHTML(
        (ratingSource && typeof ratingSource.rating === 'number') ? ratingSource.rating : (shop.Rating !== "N/A" ? shop.Rating : "N/A"),
        ratingSource?.user_ratings_total
    );

    const ratingContainerId = `rating-for-${shop.GoogleProfileID || shop.Name.replace(/[^a-zA-Z0-9]/g, '-')}-${context}`;
    const iconMarginClass = (context === 'infowindow') ? "mr-1" : "mr-2";
    const iconClasses = `w-3.5 h-3.5 ${iconMarginClass} text-gray-400 flex-shrink-0`;
    const rowTextClasses = "text-sm text-gray-600 truncate";
    const rowContainerClasses = "flex items-center";
    const detailRowsOuterDivClasses = (context === 'infowindow') ? "space-y-0.5 mt-0.5" : "space-y-1 mt-2"; // Tighter spacing for infowindow
    let detailRowsHTML = `<div class="${detailRowsOuterDivClasses}">`;

    if (shop.Address && shop.Address !== 'N/A') {
        detailRowsHTML += `<div class="${rowContainerClasses}" title="${shop.Address}"><svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg><span class="${rowTextClasses}">${shop.Address}</span></div>`;
    }

    let distanceString = '';
    // Recalculate distance for infowindow if map center is available, otherwise use shop.distance if pre-calculated
    if (context === 'infowindow' && typeof map !== 'undefined' && map.getCenter && shop.lat && shop.lng) {
        try { const shopLoc = new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng)); const mapCenter = map.getCenter(); if (shopLoc && mapCenter) { const distMeters = google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLoc); const distKm = (distMeters / 1000); const distMiles = kmToMiles(distKm); distanceString = `~${distMiles.toFixed(1)} mi / ${distKm.toFixed(1)} km from map center`;}} catch(e){}
    } else if (shop.distance != null && shop.distance !== Infinity) {
        const distKm = (shop.distance / 1000); const distMiles = kmToMiles(distKm); distanceString = `~${distMiles.toFixed(1)} mi / ${distKm.toFixed(1)} km away`;
    }
    if (distanceString) {
        detailRowsHTML += `<div class="${rowContainerClasses}" title="${distanceString}"><svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12 1.5a.75.75 0 01.75.75V3h1.25A2.75 2.75 0 0116.75 5.75v8.5A2.75 2.75 0 0114 17H6a2.75 2.75 0 01-2.75-2.75V5.75A2.75 2.75 0 016 3h1.25V2.25A.75.75 0 018 1.5h4zm-.22 6.22a.75.75 0 00-1.06-1.06L9.25 8.19V5.75a.75.75 0 00-1.5 0V8.19L6.28 6.72a.75.75 0 00-1.06 1.06L6.94 9.5l-1.72 1.72a.75.75 0 101.06 1.06L7.75 10.81v2.44a.75.75 0 001.5 0v-2.44l1.47 1.47a.75.75 0 001.06-1.06L10.06 9.5l1.72-1.72z" clip-rule="evenodd"></path></svg><span class="${rowTextClasses} text-blue-600">${distanceString}</span></div>`;
    }

    if (shop.Phone) {
        detailRowsHTML += `<div class="${rowContainerClasses}" title="${shop.Phone}"><svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg><a href="tel:${shop.Phone}" onclick="${context === 'card' ? 'event.stopPropagation();' : ''}" target="_blank" class="${rowTextClasses} text-blue-600 hover:text-blue-800 hover:underline break-all"><span class="truncate">${shop.Phone}</span></a></div>`;
    }
    if (shop.Website && shop.Website.trim() && !shop.Website.includes('googleusercontent.com')) {
        let displayWebsite = shop.Website; try { const urlObject = new URL(displayWebsite.startsWith('http') ? displayWebsite : `http://${displayWebsite}`); displayWebsite = urlObject.hostname.replace(/^www\./,''); const maxLen = context === 'infowindow' ? 20 : 30; if(displayWebsite.length > maxLen) displayWebsite = displayWebsite.substring(0,maxLen-3)+"...";} catch(e){const maxLen = context === 'infowindow' ? 20 : 30; if(displayWebsite.length > maxLen) displayWebsite = displayWebsite.substring(0,maxLen-3)+"...";}
        detailRowsHTML += `<div class="${rowContainerClasses}" title="${shop.Website}"><svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-4-4a2 2 0 012.828-2.828l3 3a2 2 0 010 2.828l-2.086 2.086a.5.5 0 01-.707-.707L11.172 8.172l1.414-1.414-3-3a.5.5 0 01.707-.707l3 3zm4.707-1.414a3 3 0 00-4.242 0l-3 3a3 3 0 000 4.242l4 4a3 3 0 004.242 0l3-3a3 3 0 000-4.242l-3-3z" clip-rule="evenodd"></path></svg><a href="${shop.Website.startsWith('http')?shop.Website:`http://${shop.Website}`}" target="_blank" rel="noopener noreferrer" onclick="${context === 'card' ? 'event.stopPropagation();' : ''}" class="${rowTextClasses} text-blue-600 hover:text-blue-800 hover:underline break-all"><span class="truncate">${displayWebsite}</span></a></div>`;
    }
    detailRowsHTML += '</div>';

    const nameSizeClass = (context === 'card') ? "text-base sm:text-lg" : "text-md";
    const textContentPaddingClass = (context === 'card') ? "p-3 sm:p-4" : "p-2";
    const nameMarginClass = "mb-1"; const ratingMarginClass = (context === 'infowindow') ? "mb-0.5" : "mb-1.5"; // Further adjusted for infowindow

    const textAndContactContent = `<div class="${textContentPaddingClass} flex-grow flex flex-col"><h2 class="${nameSizeClass} font-semibold text-gray-800 leading-tight truncate ${nameMarginClass}" title="${shop.Name}">${shop.Name}</h2><div id="${ratingContainerId}" class="shop-card-rating ${ratingMarginClass}">${starsAndRatingHTML}</div>${detailRowsHTML}<div class="mt-auto"></div></div>`;
    if (context === 'infowindow') return `<div class="infowindow-content-wrapper flex flex-col bg-white rounded-md shadow-lg overflow-hidden" style="font-family: 'Inter', sans-serif; max-width: 280px; font-size: 13px; min-height:150px;">${finalImageHTML}${textAndContactContent}</div>`; // Added bg, rounded, shadow to infowindow wrapper
    return `<div class="flex flex-col h-full">${finalImageHTML}${textAndContactContent}</div>`;
}

function populateInstagramTab(shop, instagramFeedContainerElement) {
    if (!instagramFeedContainerElement) return;
    const username = shop.InstagramUsername; const embedCode = shop.InstagramRecentPostEmbedCode;
    if (username?.trim() && embedCode?.trim()) { const cleanUsername = username.replace('@','').trim(); instagramFeedContainerElement.innerHTML = embedCode; const pLink = document.createElement('a'); pLink.href = shop.InstagramLink || `https://www.instagram.com/${cleanUsername}/`; pLink.target = "_blank"; pLink.rel = "noopener noreferrer"; pLink.className="block text-center mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm"; pLink.innerHTML = `<svg class="inline-block w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997-1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068-.18.053-1.847.28-2.377.48-.575.222-1.018.567-1.465 1.015-.447.447-.793.89-1.015 1.464-.2.53-.427 1.197-.48 2.378C2.024 8.556 2.012 8.925 2.012 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377.222.575.567 1.018 1.015 1.465.447.447.89.793 1.464 1.015.53.2 1.197.427 2.378.48 1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847.28 2.377-.48.575.222 1.018.567 1.465 1.015.447.447.793-.89 1.015 1.464.2-.53.427 1.197-.48-2.378.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377-.222-.575-.567-1.018-1.015-1.465-.447-.447-.793-.89-1.015-1.464-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg>View @${cleanUsername} on Instagram`; instagramFeedContainerElement.appendChild(pLink);}
    else if (username?.trim()) { const cleanUsername=username.replace('@','').trim();instagramFeedContainerElement.innerHTML = `<p class="text-sm text-gray-500 p-4">No recent post embed. </p><a href="${shop.InstagramLink || `https://www.instagram.com/${cleanUsername}/`}" target="_blank" rel="noopener noreferrer" class="block text-center mt-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all text-sm"><svg class="inline-block w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012..."></path></svg>View @${cleanUsername} on Instagram</a>`;} // Full SVG path omitted for brevity
    else { instagramFeedContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Instagram profile.</p>'; }
}

function generateProductIconsHTML(shop) {
    if (!shop) return '<p class="text-sm text-gray-500 text-center p-2 col-span-full">Shop data error.</p>';
    let iconsHTML = '<div id="shopProductIconsGrid" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">';
    let displayedIconCount = 0;
    for (const key in PRODUCT_ICONS_CONFIG) {
        const config = PRODUCT_ICONS_CONFIG[key]; const propKey = config.csvHeader;
        let icon = config.icon_unavailable; let classes = "product-icon-item flex flex-col items-center text-center p-1 opacity-50 transition-opacity duration-200"; let alt = `${config.name} (not available)`;
        if (shop.hasOwnProperty(propKey) && shop[propKey] === true) {
            displayedIconCount++; icon = config.icon_available;
            classes = "product-icon-item flex flex-col items-center text-center p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"; alt = config.name;
        }
        iconsHTML += `<div class="${classes}"><img src="images/icons/${icon}" alt="${alt}" class="w-12 h-12 sm:w-14 sm:h-14 object-contain mb-1"><span class="text-xs font-medium text-gray-700">${config.name}</span></div>`;
    }
    if (Object.keys(PRODUCT_ICONS_CONFIG).length === 0) iconsHTML = '<p class="text-sm text-gray-500 p-2 col-span-full">No product categories defined.</p>';
    else if (displayedIconCount === 0) iconsHTML += '</div><p class="text-xs text-gray-500 italic text-center col-span-full py-2">No featured products listed for this shop based on available categories.</p>'; // Message if no icons are active
    else iconsHTML += '</div>';
    return iconsHTML;
}

function handleGetDirections(shop) {
    if (!shop) { alert("Shop data unavailable for directions."); return; }
    let destPayload = {};
    if (shop.lat && shop.lng) destPayload = { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng), Name: shop.Name };
    else if (shop.GoogleProfileID) destPayload = { GoogleProfileID: shop.GoogleProfileID, Name: shop.Name };
    else if (shop.Address && shop.Address !== 'N/A') destPayload = { Address: shop.Address, Name: shop.Name };
    else { alert("Not enough information for directions for " + shop.Name); return; }
    if (typeof calculateAndDisplayRoute === 'function') calculateAndDisplayRoute(destPayload); // from mapLogic
    else { console.error("calculateAndDisplayRoute not defined."); alert("Directions unavailable."); }
}

function renderListings(shopsToRender, performSort = true, sortCenter = null) {
    // Ensure AppState.dom elements are used
    const { listingsContainer, noResultsDiv, searchInput } = AppState.dom;
    if (!listingsContainer) { console.error("Listings container element not found in AppState.dom."); return; }

    let shopsForDisplay = [...shopsToRender];
    const currentMapCenter = sortCenter || (typeof map !== 'undefined' && map.getCenter ? map.getCenter() : null); // map from mapLogic
    if (performSort && currentMapCenter && typeof sortShopsByDistanceGoogle === 'function') {
        shopsForDisplay = sortShopsByDistanceGoogle(shopsForDisplay, currentMapCenter);
    }
    AppState.currentlyDisplayedShops = shopsForDisplay;
    listingsContainer.innerHTML = '';

    if (shopsForDisplay.length > 0) {
        if (noResultsDiv) noResultsDiv.classList.add('hidden');
        listingsContainer.classList.remove('hidden');
        shopsForDisplay.forEach(shop => {
            const card = document.createElement('div');
            const shopId = shop.GoogleProfileID || (shop.Name + (shop.Address||'')).replace(/\W/g, '-');
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group w-full flex flex-col h-full';
            card.setAttribute('data-shop-id', shopId);
            card.innerHTML = generateShopContentHTML(shop, 'card');
            const ratingContainer = card.querySelector(`#rating-for-${shopId}-card`);
            if (!shop.placeDetails?.rating && shop.GoogleProfileID && typeof placesService !== 'undefined' && !shop._isFetchingCardDetails) { // placesService from mapLogic
                shop._isFetchingCardDetails = true;
                placesService.getDetails({ placeId: shop.GoogleProfileID, fields: ['rating', 'user_ratings_total'] }, (place, status) => {
                    shop._isFetchingCardDetails = false;
                    if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                        shop.placeDetails = { ...(shop.placeDetails || {}), rating: place.rating, user_ratings_total: place.user_ratings_total };
                        if (ratingContainer) ratingContainer.innerHTML = getStarRatingHTML(place.rating, place.user_ratings_total);
                    }
                });
            } else if (shop.placeDetails?.rating && ratingContainer) {
                ratingContainer.innerHTML = getStarRatingHTML(shop.placeDetails.rating, shop.placeDetails.user_ratings_total);
            }
            card.addEventListener('click', () => {
                openClickedShopOverlays(shop);
                if(typeof showInfoWindowForShop === 'function') setTimeout(() => showInfoWindowForShop(shop), 100); // showInfoWindowForShop from mapLogic
                document.querySelectorAll('#listingsContainer .bg-white.rounded-xl').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'));
                card.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            });
            listingsContainer.appendChild(card);
        });
    } else {
        if (noResultsDiv) {
            const searchVal = searchInput ? searchInput.value : "";
            let msg = 'No farm stands found.';
            if (searchVal.trim() !== "") msg += ` Matching "${searchVal}". Try broadening your search or adjusting filters.`;
            else if (Object.values(AppState.activeProductFilters || {}).some(v => v)) msg += ` With active filters. Try adjusting them.`;
            else if (GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER) msg = 'Data source error. Please contact support.';
            noResultsDiv.textContent = msg;
            noResultsDiv.classList.remove('hidden');
        }
        if(listingsContainer) listingsContainer.classList.add('hidden');
    }
}

// Helper sort function, uses Google Maps geometry. Placed here as renderListings is its primary caller.
function sortShopsByDistanceGoogle(shops, mapCenter) {
    if (!google?.maps?.geometry?.spherical) return shops.map(s=>({...s, distance: Infinity}));
    if (!mapCenter || !shops || shops.length === 0) return shops.map(s => ({ ...s, distance: Infinity }));
    return shops.map(shop => {
        const shopLat = parseFloat(shop.lat); const shopLng = parseFloat(shop.lng);
        if (!isNaN(shopLat) && !isNaN(shopLng)) {
            const shopLocation = new google.maps.LatLng(shopLat, shopLng);
            return { ...shop, distance: google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLocation) };
        }
        return { ...shop, distance: Infinity };
    }).sort((a, b) => a.distance - b.distance);
}

function handleInfoWindowDirectionsClick(shopData) { // Assuming shopData is a shop object
    openClickedShopOverlays(shopData);
    setTimeout(() => handleGetDirections(shopData), 150);
}