'use strict';

const PRODUCT_ICONS_CONFIG = {
    'beef': { csvHeader: 'beef', name: 'Beef', icon_available: 'beef_1.jpg', icon_unavailable: 'beef_0.jpg', category: 'Meats' },
    'pork': { csvHeader: 'pork', name: 'Pork', icon_available: 'pork_1.jpg', icon_unavailable: 'pork_0.jpg', category: 'Meats' },
    'lamb': { csvHeader: 'lamb', name: 'Lamb', icon_available: 'lamb_1.jpg', icon_unavailable: 'lamb_0.jpg', category: 'Meats' },
    'chicken':    { csvHeader: 'chicken',    name: 'Chicken',    icon_available: 'chicken_1.jpg',    icon_unavailable: 'chicken_0.jpg',    category: 'Poultry & Eggs' },
    'turkey':     { csvHeader: 'turkey',     name: 'Turkey',     icon_available: 'turkey_1.jpg',     icon_unavailable: 'turkey_0.jpg',     category: 'Poultry & Eggs' },
    'duck':       { csvHeader: 'duck',       name: 'Duck',       icon_available: 'duck_1.jpg',       icon_unavailable: 'duck_0.jpg',     category: 'Poultry & Eggs' },
    'eggs':       { csvHeader: 'eggs',       name: 'Eggs',       icon_available: 'eggs_1.jpg',       icon_unavailable: 'eggs_0.jpg',       category: 'Poultry & Eggs' },
    'corn':       { csvHeader: 'corn',       name: 'Corn',       icon_available: 'corn_1.jpg',       icon_unavailable: 'corn_0.jpg',       category: 'Vegetables' },
    'carrots':    { csvHeader: 'carrots',    name: 'Carrots',    icon_available: 'carrots_1.jpg',    icon_unavailable: 'carrots_0.jpg',    category: 'Vegetables' },
    'potatoes':   { csvHeader: 'potatoes',   name: 'Potatoes',   icon_available: 'potatoes_1.jpg',   icon_unavailable: 'potatoes_0.jpg',   category: 'Vegetables' },
    'lettus':     { csvHeader: 'lettus',     name: 'Lettuce',    icon_available: 'lettus_1.jpg',     icon_unavailable: 'lettus_0.jpg',     category: 'Vegetables' },
    'spinach':    { csvHeader: 'spinach',    name: 'Spinach',    icon_available: 'spinach_1.jpg',    icon_unavailable: 'spinach_0.jpg',    category: 'Vegetables' },
    'squash':     { csvHeader: 'squash',     name: 'Squash',     icon_available: 'squash_1.jpg',     icon_unavailable: 'squash_0.jpg',     category: 'Vegetables' },
    'tomatoes':   { csvHeader: 'tomatoes',   name: 'Tomatoes',   icon_available: 'tomatoes_1.jpg',   icon_unavailable: 'tomatoes_0.jpg',   category: 'Vegetables' },
    'peppers':    { csvHeader: 'peppers',    name: 'Peppers',    icon_available: 'peppers_1.jpg',    icon_unavailable: 'peppers_0.jpg',    category: 'Vegetables' },
    'cucumbers':  { csvHeader: 'cucumbers',  name: 'Cucumbers',  icon_available: 'cucumbers_1.jpg',  icon_unavailable: 'cucumbers_0.jpg',  category: 'Vegetables' },
    'zucchini':   { csvHeader: 'zucchini',   name: 'Zucchini',   icon_available: 'zucchini_1.jpg',   icon_unavailable: 'zucchini_0.jpg',   category: 'Vegetables' },
    'garlic':     { csvHeader: 'garlic',     name: 'Garlic',     icon_available: 'garlic_1.jpg',     icon_unavailable: 'garlic_0.jpg',     category: 'Aromatics' },
    'onions':     { csvHeader: 'onions',     name: 'Onions',     icon_available: 'onions_1.jpg',     icon_unavailable: 'onions_0.jpg',     category: 'Aromatics' },
    'strawberries': { csvHeader: 'strawberries', name: 'Strawberries', icon_available: 'strawberries_1.jpg', icon_unavailable: 'strawberries_0.jpg', category: 'Fruits' },
    'blueberries':  { csvHeader: 'blueberries',  name: 'Blueberries',  icon_available: 'blueberries_1.jpg',  icon_unavailable: 'blueberries_0.jpg',  category: 'Fruits' },
};
const FILTERABLE_PRODUCT_ATTRIBUTES = Object.keys(PRODUCT_ICONS_CONFIG);
const CATEGORY_DISPLAY_ORDER = ['Meats', 'Poultry & Eggs', 'Vegetables', 'Fruits', 'Aromatics', 'Other']; // Added 'Other'

document.addEventListener('DOMContentLoaded', () => {
    if (!window.AppState || !window.AppState.dom) {
        console.error("uiLogic.js: CRITICAL - AppState or AppState.dom not initialized by main.js! Some UI logic may fail.");
        return;
    }
    const uiDom = AppState.dom;

    // Log to ensure elements are populated from main.js when this uiLogic DOMContentLoaded fires
    console.log("uiLogic.js DOMContentLoaded: AppState.dom.productFilterToggleElement:", uiDom.productFilterToggleElement);
    console.log("uiLogic.js DOMContentLoaded: AppState.dom.productFilterDropdownElement:", uiDom.productFilterDropdownElement);

    if (uiDom.productFilterToggleElement &&
        uiDom.productFilterDropdownElement &&
        uiDom.productFilterCheckboxesContainer &&
        uiDom.resetProductFiltersButton &&
        uiDom.activeFilterCountElement) {

        console.log("uiLogic.js: Filter elements found. Setting up filter UI.");
        populateProductFilterDropdown();

        uiDom.productFilterToggleElement.addEventListener('click', (e) => {
            e.stopPropagation(); // This is crucial
            console.log("--- uiLogic.js: productFilterToggle CLICKED ---");
            const dropdown = uiDom.productFilterDropdownElement;
            if (dropdown) {
                console.log("Dropdown classes BEFORE toggle:", dropdown.className);
                dropdown.classList.toggle('hidden');
                console.log("Dropdown 'hidden' class present AFTER toggle:", dropdown.classList.contains('hidden'));
                console.log("Dropdown classes AFTER toggle:", dropdown.className);
            } else {
                console.error("uiLogic.js: productFilterDropdownElement is null in toggle click!");
            }
        });

        uiDom.resetProductFiltersButton.addEventListener('click', () => {
            console.log("uiLogic.js: Reset Product Filters CLICKED!");
            FILTERABLE_PRODUCT_ATTRIBUTES.forEach(attr => { AppState.activeProductFilters[attr] = false;
                const cb = uiDom.productFilterCheckboxesContainer.querySelector(`input[name="${attr}"]`); if (cb) cb.checked = false;
            });
            updateActiveFilterCountDisplay();
            if (typeof handleSearch === 'function') handleSearch(); // handleSearch from main.js
            if(uiDom.productFilterDropdownElement) uiDom.productFilterDropdownElement.classList.add('hidden'); // Ensure it closes
        });

        // Refined body click listener
        document.addEventListener('click', (e) => { // Changed from document.body to document for wider capture, then check target.
            const isDropdownVisible = uiDom.productFilterDropdownElement && !uiDom.productFilterDropdownElement.classList.contains('hidden');
            if (!isDropdownVisible) return; // Do nothing if dropdown is already hidden

            const clickedOnToggleButton = uiDom.productFilterToggleElement && uiDom.productFilterToggleElement.contains(e.target);
            const clickedInsideDropdown = uiDom.productFilterDropdownElement && uiDom.productFilterDropdownElement.contains(e.target);

            // console.log(`Body click: Toggle clicked=${clickedOnToggleButton}, Dropdown clicked=${clickedInsideDropdown}, Target=${e.target.id || e.target.tagName}`);

            if (!clickedOnToggleButton && !clickedInsideDropdown) {
                console.log("uiLogic.js: Body click detected truly outside filter components. Hiding dropdown.");
                uiDom.productFilterDropdownElement.classList.add('hidden');
            }
        });

    } else {
        console.warn("uiLogic.js: One or more essential product filter DOM elements NOT found in AppState.dom. Filter UI setup SKIPPED.");
        console.log({
            toggle: uiDom.productFilterToggleElement,
            dropdown: uiDom.productFilterDropdownElement,
            checkboxesContainer: uiDom.productFilterCheckboxesContainer,
            resetButton: uiDom.resetProductFiltersButton,
            activeCountSpan: uiDom.activeFilterCountElement
        });
    }

    // Listeners for overlay close buttons (directions buttons, social tabs should remain similar)
    if (uiDom.getShopDirectionsButton) { /* ... as before ... */ }
    if (uiDom.clearShopDirectionsButton) { /* ... as before ... */ }
    if (uiDom.closeDetailsOverlaySocialButton) uiDom.closeDetailsOverlaySocialButton.addEventListener('click', closeClickedShopOverlays);
    if (uiDom.closeDetailsOverlayShopButton) uiDom.closeDetailsOverlayShopButton.addEventListener('click', closeClickedShopOverlays);
    if (uiDom.socialOverlayTabs && uiDom.detailsOverlaySocialElement) { /* ... social tabs logic as before ... */ }
});

function populateProductFilterDropdown() {
    // Ensure AppState.dom exists and FILTERABLE_PRODUCT_ATTRIBUTES is populated
    if (!AppState.dom?.productFilterCheckboxesContainer || !FILTERABLE_PRODUCT_ATTRIBUTES || FILTERABLE_PRODUCT_ATTRIBUTES.length === 0) {
        console.warn("populateProductFilterDropdown: Cannot proceed. Checkbox container missing or no filterable attributes. Attrs len:", FILTERABLE_PRODUCT_ATTRIBUTES?.length);
        if(AppState.dom?.productFilterCheckboxesContainer) AppState.dom.productFilterCheckboxesContainer.innerHTML = '<p class="text-xs text-gray-500">No filters.</p>';
        return;
    }
    // ... rest of populateProductFilterDropdown as provided (should be fine now if FILTERABLE_PRODUCT_ATTRIBUTES is correct)
    AppState.dom.productFilterCheckboxesContainer.innerHTML = '';
    AppState.activeProductFilters = AppState.activeProductFilters || {};

    FILTERABLE_PRODUCT_ATTRIBUTES.forEach(attrKey => {
        const attributeConfig = PRODUCT_ICONS_CONFIG[attrKey];
        if (!attributeConfig) {
            console.warn(`No config for product attribute: ${attrKey}`);
            return; 
        }
        const displayName = attributeConfig.name || (attrKey.charAt(0).toUpperCase() + attrKey.slice(1));
        const iconFileName = attributeConfig.icon_available || null;
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
            if (typeof handleSearch === 'function') handleSearch(); // Call main.js handleSearch
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

function updateActiveFilterCountDisplay() { /* ... same as before, uses AppState.dom ... */
    if (!AppState.dom.activeFilterCountElement || !AppState.dom.productFilterToggleElement) return;
    const count = Object.values(AppState.activeProductFilters || {}).filter(isActive => isActive).length;
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

function openOverlay(overlayElement) { /* ... same as before ... */
    if (!overlayElement) return;
    overlayElement.classList.remove('hidden'); overlayElement.classList.add('is-open');
    document.body.classList.add('modal-active'); // Standardize on body class for scroll lock
}

function closeOverlay(overlayElement) { /* ... same as before ... */
    if (!overlayElement) return;
    overlayElement.classList.remove('is-open'); overlayElement.classList.add('hidden');
    if (!AppState.dom.detailsOverlayShopElement?.classList.contains('is-open') &&
        !AppState.dom.detailsOverlaySocialElement?.classList.contains('is-open') &&
        !document.getElementById('initialSearchModal')?.classList.contains('modal-open') /* Also check initial modal */) {
        document.body.classList.remove('modal-active');
    }
}

// (Make sure to include the FULL implementations of the following functions from your previous uiLogic.js,
// ensuring they use AppState.dom where applicable. I've only put stubs or brief outlines here
// to keep this response focused, but you need the complete functions.)

function closeClickedShopOverlays() { /* ... (Full logic using AppState.dom) ... */
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
        // Reset content placeholders
         ['socialLinksContainer', 'twitterTimelineContainer', 'instagramFeedContainer', 'socialOverlayReviewsContainer', 'socialOverlayGooglePhotosContainer']
            .forEach(key => {
                if (AppState.dom[key]) {
                    AppState.dom[key].innerHTML = `<p class="text-sm text-gray-500 p-4 text-center">Loading content...</p>`;
                    if(AppState.dom[key].dataset) {
                       if(key === 'socialLinksContainer') AppState.dom[key].dataset.currentPageId = '';
                       if(key === 'twitterTimelineContainer') AppState.dom[key].dataset.currentTwitterHandle = '';
                       if(key === 'instagramFeedContainer') AppState.dom[key].dataset.currentInstaUser = '';
                    }
                }
            });
    }
}

function getStarRatingHTML(ratingStringOrNumber, reviewCount) { /* ... Full implementation ... */
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

function getStarsVisualHTML(ratingStringOrNumber, starSizeClass = 'w-5 h-5') { /* ... Full implementation ... */
    const rating = parseFloat(ratingStringOrNumber);
    if (ratingStringOrNumber === "N/A" || isNaN(rating) || rating < 0 || rating > 5) return '<span class="text-sm text-gray-500">No rating</span>';
    const roundedForStarDisplay = Math.round(rating);
    const starSVGPath = "M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z";
    let starsHTML = `<span class="inline-flex items-center">`;
    for (let i = 0; i < 5; i++) starsHTML += `<svg class="${starSizeClass} fill-current ${i < roundedForStarDisplay ? 'text-yellow-400' : 'text-gray-300'}" viewBox="0 0 20 20"><path d="${starSVGPath}"/></svg>`;
    starsHTML += `</span>`; return starsHTML;
}

function generateFacebookPagePluginHTML(pageId, pageName) { /* ... Full implementation ... */
    if (!pageId) return '<!-- Error: Facebook Page ID missing. -->';
    const facebookPageLink = `https://www.facebook.com/${pageId}/`; const displayName = pageName || pageId;
    return `<div class="fb-page" data-href="${facebookPageLink}" data-tabs="timeline" data-width="100%" data-height="100%" data-use-container-width="true" data-small-header="true" data-adapt-container-width="true" data-hide-cover="true" data-show-facepile="false"><blockquote cite="${facebookPageLink}" class="fb-xfbml-parse-ignore"><a href="${facebookPageLink}">${displayName}</a></blockquote></div>`;
}

function displayTwitterTimeline(twitterHandle, containerElement) { /* ... Full implementation ... */
    if (!containerElement) return; containerElement.innerHTML = '';
    if (!twitterHandle?.trim()) { containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Twitter handle configured.</p>'; return; }
    const cleanHandle = twitterHandle.replace('@', '').trim();
    if (!cleanHandle) { containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">Invalid Twitter handle.</p>'; return; }
    containerElement.innerHTML = `<p class="text-sm text-gray-400 p-4">Loading Twitter for @${cleanHandle}...</p>`;
    if (typeof twttr?.widgets?.createTimeline !== 'function') { containerElement.innerHTML = '<p class="text-sm text-red-500 p-4">Twitter script not available.</p>'; return; }
    try { const promise = twttr.widgets.createTimeline({ sourceType: 'profile', screenName: cleanHandle }, containerElement, { theme: 'light', chrome: 'noheader nofooter noborders noscrollbar transparent', tweetLimit: 10 });
        if (!promise?.then) { if (containerElement.innerHTML.includes("Loading")) containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Twitter widget creation failed.</p>`; return; }
        promise.then(el => { if (!el) containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Could not embed @${cleanHandle}.</p>`; else { const i = containerElement.querySelector('iframe'); if(i){i.style.height='100%';i.style.minHeight='400px';} }}
        ).catch(e => { console.error(`Err Twitter @${cleanHandle}:`, e); containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Error embedding Twitter.</p>`; });
    } catch (error) { console.error(`Sync err Twitter @${cleanHandle}:`, error); containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Failed Twitter init.</p>`; }
}
function displayGooglePlacePhotos(placeDetails, containerElement) { /* ... Full implementation ... */
    if (!containerElement) return; containerElement.innerHTML = '';
    if (placeDetails?.photos?.length > 0) {
        placeDetails.photos.slice(0, 9).forEach(photo => {
            const iC = document.createElement('div'); iC.className='gallery-image-container google-photo-item'; const i = document.createElement('img'); i.src=photo.getUrl({maxWidth:400,maxHeight:300}); i.alt=`Photo of ${placeDetails.name||'shop'}`; i.className='gallery-image'; i.onerror=function(){this.parentElement.innerHTML='<p class="text-xs text-gray-500 p-2">Img unavailable</p>';}; iC.appendChild(i); containerElement.appendChild(iC);
        });
    } else { containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 col-span-full text-center">No Google photos.</p>'; }
}
async function openClickedShopOverlays(shop) { /* ... Full implementation from your previous complete version, ensuring AppState.dom.* is used ... */ }
function displayOpeningHours(placeDetails, containerElement) { /* ... Full HORIZONTAL LAYOUT implementation using AppState.dom.* ... */ }
function displayShopReviews(placeDetails, containerElement) { /* ... Full implementation using AppState.dom.* ... */ }
function generateShopContentHTML(shop, context = 'card') { /* ... Full TEMPLATED version ... */ }
function populateInstagramTab(shop, instagramFeedContainerElement) { /* ... Full implementation ... */ }
function generateProductIconsHTML(shop) { /* ... Full CATEGORIZED version ... */ }
function handleGetDirections(shop) { /* ... Full implementation ... */ }
function renderListings(shopsToRender, performSort = true, sortCenter = null) { /* ... Full implementation using AppState.dom.* ... */ }
function sortShopsByDistanceGoogle(shops, mapCenter) { /* ... Full implementation ... */ }
function handleInfoWindowDirectionsClick(shopData) { /* ... Full implementation ... */ }