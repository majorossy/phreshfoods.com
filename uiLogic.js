// At the top of uiLogic.js, with other global-like variables:
let productFilterToggleElement, productFilterDropdownElement, productFilterCheckboxesContainer, resetProductFiltersButton, activeFilterCountElement;
let activeProductFilters = {}; // Stores { beef: true, corn: false, ... }

// PRODUCT_ICONS_CONFIG should be defined before this line.
// It is defined at the bottom of this file in the original structure.
// Let's move it up or ensure it's defined. For safety, I'll assume it's defined.
// If PRODUCT_ICONS_CONFIG is defined later in this file, this will cause an error.
// It's better to define constants like PRODUCT_ICONS_CONFIG at the top.

// Let's define PRODUCT_ICONS_CONFIG here for clarity if it's not already at the top
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
    'lettus': { csvHeader: 'lettus', name: 'Lettus', icon_available: 'lettus_1.jpg', icon_unavailable: 'lettus_0.jpg' }, // Assuming 'lettus' is intentional
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
    window.detailsOverlayShopElement = document.getElementById('detailsOverlayShop');
    window.detailsOverlaySocialElement = document.getElementById('detailsOverlaySocial');
    window.shopDetailNameElement = document.getElementById('shopDetailName');

    // Initialize filter UI elements
    productFilterToggleElement = document.getElementById('productFilterToggle');
    productFilterDropdownElement = document.getElementById('productFilterDropdown');
    productFilterCheckboxesContainer = document.getElementById('productFilterCheckboxes');
    resetProductFiltersButton = document.getElementById('resetProductFilters');
    activeFilterCountElement = document.getElementById('activeFilterCount');

    if (productFilterToggleElement && productFilterDropdownElement && productFilterCheckboxesContainer && resetProductFiltersButton && activeFilterCountElement) {
        populateProductFilterDropdown(); // Populate dropdown with checkboxes

        productFilterToggleElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent body click from closing it immediately
            productFilterDropdownElement.classList.toggle('hidden');
        });

        resetProductFiltersButton.addEventListener('click', () => {
            FILTERABLE_PRODUCT_ATTRIBUTES.forEach(attr => {
                activeProductFilters[attr] = false;
                const checkbox = productFilterCheckboxesContainer.querySelector(`input[name="${attr}"]`);
                if (checkbox) checkbox.checked = false;
            });
            updateActiveFilterCountDisplay();
            if (typeof handleSearch === 'function') { // handleSearch is in main.js
                handleSearch(); // Trigger re-filtering
            }
            productFilterDropdownElement.classList.add('hidden'); // Close dropdown
        });

        // Close dropdown if clicking outside of it
        document.body.addEventListener('click', (e) => {
            if (productFilterDropdownElement && !productFilterDropdownElement.classList.contains('hidden')) {
                if (!productFilterToggleElement.contains(e.target) && !productFilterDropdownElement.contains(e.target)) {
                    productFilterDropdownElement.classList.add('hidden');
                }
            }
        });
    }


    const getDirectionsBtnOverlay = document.getElementById('getShopDirectionsButton');
    if (getDirectionsBtnOverlay) {
        getDirectionsBtnOverlay.addEventListener('click', () => {
            if (currentShopForDirections) {
                handleGetDirections(currentShopForDirections);
            } else {
                console.error("No shop selected for overlay directions.");
                alert("Please select a shop first.");
            }
        });
    }

    const clearDirectionsBtn = document.getElementById('clearShopDirectionsButton');
    if (clearDirectionsBtn) {
        clearDirectionsBtn.addEventListener('click', () => {
            if (typeof clearDirections === 'function') {
                clearDirections();
            }
        });
    }

    const closeSocialOverlayBtn = document.getElementById('closeDetailsOverlaySocialButton');
    if (closeSocialOverlayBtn) {
        closeSocialOverlayBtn.addEventListener('click', closeClickedShopOverlays);
    }
    const closeShopOverlayBtn = document.getElementById('closeDetailsOverlayShopButton');
     if (closeShopOverlayBtn) {
        closeShopOverlayBtn.addEventListener('click', closeClickedShopOverlays);
    }

    const socialTabsContainer = document.getElementById('socialOverlayTabs');
    if (socialTabsContainer) {
        const tabButtons = socialTabsContainer.querySelectorAll('.social-tab-button');
        const tabContents = window.detailsOverlaySocialElement.querySelectorAll('.social-tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetPanelId = button.dataset.tabTarget;

                tabButtons.forEach(btn => {
                    btn.classList.remove('active-social-tab');
                    btn.setAttribute('aria-selected', 'false');
                });
                button.classList.add('active-social-tab');
                button.setAttribute('aria-selected', 'true');

                tabContents.forEach(panel => {
                    if (panel.id === targetPanelId) {
                        panel.classList.remove('hidden');
                        if (targetPanelId === 'social-facebook-panel' && typeof FB !== 'undefined' && FB.XFBML) {
                             const fbContentContainer = document.getElementById('socialLinksContainer');
                             if(fbContentContainer && fbContentContainer.querySelector('.fb-page')) {
                                setTimeout(() => {
                                    console.log("FB.XFBML.parse on tab click for:", fbContentContainer.dataset.currentPageId);
                                    FB.XFBML.parse(fbContentContainer);
                                }, 50);
                             }
                        }
                        if (targetPanelId === 'social-instagram-panel' && typeof window.instgrm !== 'undefined' && window.instgrm.Embeds) {
                            const igContainer = document.getElementById('instagramFeedContainer');
                            console.log("Instagram tab clicked. Container content before process:", igContainer ? igContainer.innerHTML.substring(0,150) + "..." : "IG Container not found!");
                            console.log("Calling window.instgrm.Embeds.process().");
                            setTimeout(() => {
                                console.log("Executing window.instgrm.Embeds.process() for IG tab now.");
                                window.instgrm.Embeds.process();
                            }, 100);
                        }
                    } else {
                        panel.classList.add('hidden');
                    }
                });
                if(detailsOverlaySocialElement) detailsOverlaySocialElement.scrollTop = 0;
            });
        });
    }
});

function populateProductFilterDropdown() {
    if (!productFilterCheckboxesContainer || !FILTERABLE_PRODUCT_ATTRIBUTES) return;
    productFilterCheckboxesContainer.innerHTML = ''; // Clear existing

    FILTERABLE_PRODUCT_ATTRIBUTES.forEach(attrKey => {
        const attributeConfig = PRODUCT_ICONS_CONFIG[attrKey];
        const displayName = attributeConfig ? attributeConfig.name : (attrKey.charAt(0).toUpperCase() + attrKey.slice(1));
        const iconFileName = attributeConfig ? attributeConfig.icon_available : null; // Get the available icon

        activeProductFilters[attrKey] = activeProductFilters[attrKey] || false; // Initialize if not set

        const label = document.createElement('label');
        // Tailwind classes for styling label, can be adjusted
        // Added 'flex items-center' to align checkbox, icon, and text
        label.className = 'block hover:bg-gray-100 p-1 rounded transition-colors duration-150 flex items-center cursor-pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = attrKey;
        // Tailwind form styles, adjusted margin
        checkbox.className = 'form-checkbox h-3 w-3 text-red-600 border-gray-300 rounded focus:ring-red-500 mr-2';
        checkbox.checked = activeProductFilters[attrKey];

        checkbox.addEventListener('change', (e) => {
            activeProductFilters[attrKey] = e.target.checked;
            updateActiveFilterCountDisplay();
            if (typeof handleSearch === 'function') { // handleSearch is in main.js
                handleSearch(); // Re-filter and update map/listings
            }
        });

        label.appendChild(checkbox);

        // --- NEW: Add Icon ---
        if (iconFileName) {
            const iconImg = document.createElement('img');
            iconImg.src = `images/icons/${iconFileName}`;
            iconImg.alt = `${displayName} icon`;
            // Tailwind classes for icon styling
            iconImg.className = 'w-4 h-4 object-contain mr-1.5'; // Adjust size and margin as needed
            label.appendChild(iconImg);
        }
        // --- END NEW: Add Icon ---

        label.appendChild(document.createTextNode(`${displayName}`)); // Removed leading space as icon/checkbox provides spacing
        productFilterCheckboxesContainer.appendChild(label);
    });
    updateActiveFilterCountDisplay(); // Initial count update
}


// New function to update the display of how many filters are active
function updateActiveFilterCountDisplay() {
    if (!activeFilterCountElement || !productFilterToggleElement) return;

    const count = Object.values(activeProductFilters).filter(isActive => isActive).length;

    if (count > 0) {
        activeFilterCountElement.textContent = `(${count})`;
        activeFilterCountElement.classList.remove('hidden');
        activeFilterCountElement.classList.add('visible');
        productFilterToggleElement.classList.add('filters-active');
    } else {
        activeFilterCountElement.textContent = '';
        activeFilterCountElement.classList.add('hidden');
        activeFilterCountElement.classList.remove('visible');
        productFilterToggleElement.classList.remove('filters-active');
    }
}

// Expose activeProductFilters to main.js (or other modules) if needed
window.activeProductFilters = activeProductFilters;


function openOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.add('is-open');
}

function closeOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.classList.add('hidden');
}

function getStarRatingHTML(ratingStringOrNumber, reviewCount) {
    const rating = parseFloat(ratingStringOrNumber);

    if (ratingStringOrNumber === "N/A" || isNaN(rating) || rating < 0 || rating > 5) {
        return `<div class="flex items-center text-sm text-gray-500">No rating available</div>`;
    }

    const numRating = parseFloat(rating.toFixed(1));
    const displayRatingValue = numRating.toFixed(1);
    const roundedForStarDisplay = Math.round(numRating);

    const starSVGPath = "M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z";

    let starsHTML = `<span class="inline-flex items-center">`;
    for (let i = 0; i < 5; i++) {
        if (i < roundedForStarDisplay) {
            starsHTML += `<svg class="w-4 h-4 fill-current text-yellow-400" viewBox="0 0 20 20"><path d="${starSVGPath}"/></svg>`;
        } else {
            starsHTML += `<svg class="w-4 h-4 fill-current text-gray-300" viewBox="0 0 20 20"><path d="${starSVGPath}"/></svg>`;
        }
    }
    starsHTML += `</span>`;

    let reviewCountHTML = '';
    if (typeof reviewCount === 'number' && reviewCount >= 0) {
        reviewCountHTML = `<span class="text-gray-500 group-hover:text-gray-700 group-hover:underline">(${reviewCount.toLocaleString()})</span>`;
    }

    return `
      <div class="flex items-center gap-x-1 text-sm">
        <span class="font-semibold text-gray-700">${displayRatingValue}</span>
        ${starsHTML}
        ${reviewCountHTML}
      </div>
    `;
}


// ADD THIS NEW FUNCTION
function getStarsVisualHTML(ratingStringOrNumber, starSizeClass = 'w-5 h-5') {
    const rating = parseFloat(ratingStringOrNumber);
    if (ratingStringOrNumber === "N/A" || isNaN(rating) || rating < 0 || rating > 5) {
        return '<span class="text-sm text-gray-500">No rating</span>';
    }
    const roundedForStarDisplay = Math.round(rating); // Use original rating for rounding stars
    const starSVGPath = "M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z";

    let starsHTML = `<span class="inline-flex items-center">`;
    for (let i = 0; i < 5; i++) {
        if (i < roundedForStarDisplay) {
            starsHTML += `<svg class="${starSizeClass} fill-current text-yellow-400" viewBox="0 0 20 20"><path d="${starSVGPath}"/></svg>`;
        } else {
            starsHTML += `<svg class="${starSizeClass} fill-current text-gray-300" viewBox="0 0 20 20"><path d="${starSVGPath}"/></svg>`;
        }
    }
    starsHTML += `</span>`;
    return starsHTML;
}

function generateFacebookPagePluginHTML(pageId, pageName) {
    if (!pageId) return '<!-- Error: Facebook Page ID missing. -->';
    const facebookPageLink = `https://www.facebook.com/${pageId}/`;
    const displayName = pageName || pageId;
    return `
<div class="fb-page"
    data-href="${facebookPageLink}"
    data-tabs="timeline"
    data-width="100%"
    data-height="100%"
    data-use-container-width="true"
    data-small-header="true"
    data-adapt-container-width="true"
    data-hide-cover="true"
    data-show-facepile="false">
    <blockquote cite="${facebookPageLink}" class="fb-xfbml-parse-ignore"><a href="${facebookPageLink}">${displayName}</a></blockquote>
</div>`;
}

function displayTwitterTimeline(twitterHandle, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = '';
    if (!twitterHandle || typeof twitterHandle !== 'string' || twitterHandle.trim() === '') {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Twitter handle configured.</p>';
        return;
    }
    const cleanHandle = twitterHandle.replace('@', '').trim();
    if (!cleanHandle) {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">Invalid Twitter handle.</p>';
        return;
    }
    containerElement.innerHTML = `<p class="text-sm text-gray-400 p-4">Loading Twitter feed for @${cleanHandle}...</p>`;
    if (typeof twttr === 'undefined' || !twttr.widgets || typeof twttr.widgets.createTimeline !== 'function') {
        containerElement.innerHTML = '<p class="text-sm text-red-500 p-4">Twitter embedding script not available.</p>';
        return;
    }
    try {
        const promise = twttr.widgets.createTimeline(
            { sourceType: 'profile', screenName: cleanHandle },
            containerElement,
            {
              theme: 'light',
              chrome: 'noheader nofooter noborders noscrollbar transparent',
              tweetLimit: 10
            }
        );
        if (!promise || typeof promise.then !== 'function') {
            if (containerElement.innerHTML.includes("Loading Twitter feed")) {
                 containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Twitter widget creation may have failed for @${cleanHandle}.</p>`;
            }
            return;
        }
        promise.then(el => {
            if (!el) {
                containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Could not embed Twitter for @${cleanHandle}. Account might be private/suspended or handle incorrect.</p>`;
            } else {
                const iframe = containerElement.querySelector('iframe');
                if (iframe) {
                    iframe.style.height = '100%';
                    iframe.style.minHeight = '400px';
                }
            }
        }).catch(e => {
            console.error("Error creating Twitter timeline for @" + cleanHandle + ":", e);
            containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Error embedding Twitter for @${cleanHandle}.</p>`;
        });
    } catch (error) {
        console.error("Synchronous error calling createTimeline for @" + cleanHandle + ":", error);
        containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Failed to initiate Twitter embedding for @${cleanHandle}.</p>`;
    }
}

function displayGooglePlacePhotos(placeDetails, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = '';

    if (placeDetails && placeDetails.photos && placeDetails.photos.length > 0) {
        placeDetails.photos.slice(0, 9).forEach(photo => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'gallery-image-container google-photo-item';
            const img = document.createElement('img');
            img.src = photo.getUrl({ maxWidth: 400, maxHeight: 300 });
            img.alt = `Photo of ${placeDetails.name || 'shop'}`;
            img.className = 'gallery-image';
            img.onerror = function() {
                this.parentElement.innerHTML = '<p class="text-xs text-gray-500 text-center p-2">Image unavailable</p>';
            };
            imgContainer.appendChild(img);
            containerElement.appendChild(imgContainer);
        });
    } else {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 col-span-full text-center">No photos found on Google for this place.</p>';
    }
}


// In uiLogic.js

async function openClickedShopOverlays(shop) {
    if (!shop) { console.error("Shop data is null in openClickedShopOverlays."); return; }
    currentShopForDirections = shop;
    let shopOverlayActuallyOpened = false;
    let socialOverlayActuallyOpened = false;

    // Declare container variables at a higher scope, initialized to null or assigned later
    let fbContentContainer = null;
    let twContentContainer = null;
    let igContentContainer = null;
    let reviewsSocialContainer = null;
    let googlePhotosContainer = null;
    let openingHoursContainer = null; // For the shop details overlay
    // csvGalleryContainer is specific to the shop overlay block, can remain local there.

    if (detailsOverlayShopElement) {
        openOverlay(detailsOverlayShopElement);
        detailsOverlayShopElement.scrollTop = 0;
        shopOverlayActuallyOpened = true;

        try {
            if (shopDetailNameElement) shopDetailNameElement.textContent = shop.Name || 'N/A';

            const csvGalleryContainer = document.getElementById('shopImageGallery');
            if (csvGalleryContainer) {
                csvGalleryContainer.innerHTML = '';
                const imageFilenames = [shop.ImageOne, shop.ImageTwo, shop.ImageThree].filter(Boolean);
                if (imageFilenames.length > 0) {
                    imageFilenames.forEach(filename => {
                        const trimmedFilename = filename.trim();
                        if (!trimmedFilename) return;
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'gallery-image-container';
                        const img = document.createElement('img');
                        img.src = `images/${trimmedFilename}`;
                        img.alt = `${shop.Name || 'Shop'} CSV image - ${trimmedFilename}`;
                        img.className = 'gallery-image';
                        img.onerror = function() { this.parentElement.innerHTML = '<p class="text-xs text-gray-500 text-center p-2">Image not found</p>'; };
                        imgContainer.appendChild(img);
                        csvGalleryContainer.appendChild(imgContainer);
                    });
                } else {
                    csvGalleryContainer.innerHTML = '<p class="text-sm text-gray-500 text-center p-4 col-span-full">No listing photos available.</p>';
                }
            }

            // Initialize openingHoursContainer for the shop details panel
            openingHoursContainer = document.getElementById('shopOpeningHoursContainer');
            if (openingHoursContainer) {
                openingHoursContainer.innerHTML = '<p class="text-sm text-gray-500 text-center p-2">Loading hours...</p>';
            }

            const productIconsContainer = document.getElementById('shopProductIconsContainer');
            if (productIconsContainer) {
                if (shop) {
                    productIconsContainer.innerHTML = generateProductIconsHTML(shop);
                } else {
                    productIconsContainer.innerHTML = '<p class="text-sm text-gray-500 text-center p-2">Shop data error.</p>';
                }
            }

            document.getElementById('getShopDirectionsButton')?.classList.remove('hidden');
            document.getElementById('clearShopDirectionsButton')?.classList.add('hidden');
            const directionsPanelDiv = document.getElementById('directionsPanel');
            if (directionsPanelDiv) directionsPanelDiv.innerHTML = "";

        } catch (e) { console.error("Error populating RIGHT shop overlay:", e); }
    }

    if (detailsOverlaySocialElement) {
        openOverlay(detailsOverlaySocialElement);
        detailsOverlaySocialElement.scrollTop = 0;
        socialOverlayActuallyOpened = true;

        try {
            // Initialize social overlay DOM elements
            fbContentContainer = document.getElementById('socialLinksContainer');
            twContentContainer = document.getElementById('twitterTimelineContainer');
            igContentContainer = document.getElementById('instagramFeedContainer');
            reviewsSocialContainer = document.getElementById('socialOverlayReviewsContainer');
            googlePhotosContainer = document.getElementById('socialOverlayGooglePhotosContainer');

            if (fbContentContainer) {
                if (shop.FacebookPageID) {
                    if (!fbContentContainer.querySelector('.fb-page') || fbContentContainer.dataset.currentPageId !== shop.FacebookPageID) {
                        fbContentContainer.innerHTML = generateFacebookPagePluginHTML(shop.FacebookPageID, shop.Name);
                        fbContentContainer.dataset.currentPageId = shop.FacebookPageID;
                    }
                } else { fbContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Facebook Page configured.</p>'; }
            }

            if (twContentContainer) {
                if (shop.TwitterHandle) {
                    if (twContentContainer.dataset.currentTwitterHandle !== shop.TwitterHandle) {
                        displayTwitterTimeline(shop.TwitterHandle, twContentContainer);
                        twContentContainer.dataset.currentTwitterHandle = shop.TwitterHandle;
                    }
                } else { twContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Twitter handle configured.</p>'; }
            }

            if (igContentContainer) {
                 if (shop.InstagramUsername && shop.InstagramRecentPostEmbedCode) {
                    if (igContentContainer.dataset.currentInstaUser !== shop.InstagramUsername || !igContentContainer.innerHTML.includes('instagram-media')) {
                       populateInstagramTab(shop, igContentContainer);
                       igContentContainer.dataset.currentInstaUser = shop.InstagramUsername;
                    }
                } else if (shop.InstagramUsername) {
                     if (igContentContainer.dataset.currentInstaUser !== shop.InstagramUsername) {
                        populateInstagramTab(shop, igContentContainer);
                        igContentContainer.dataset.currentInstaUser = shop.InstagramUsername;
                     }
                } else {
                    igContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Instagram profile configured.</p>';
                    igContentContainer.dataset.currentInstaUser = '';
                }
            }

            if (reviewsSocialContainer) reviewsSocialContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Loading reviews...</p>';
            if (googlePhotosContainer) googlePhotosContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 col-span-full text-center">Loading Google Photos...</p>';

            // Google Places API call and subsequent UI updates
            if (shop.GoogleProfileID && typeof placesService !== 'undefined' && typeof google !== 'undefined') {
                // CORRECTED: Use 'utc_offset_minutes'
                const fieldsToFetch = ['reviews', 'photos', 'rating', 'user_ratings_total', 'url', 'name', 'place_id', 'opening_hours', 'utc_offset_minutes', 'business_status'];

                if (!shop.placeDetails || !shop.placeDetails.opening_hours) { // Check if we need to fetch (or re-fetch if hours missing)
                    placesService.getDetails(
                        { placeId: shop.GoogleProfileID, fields: fieldsToFetch },
                        (place, status) => {
                            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                                shop.placeDetails = { ...shop.placeDetails, ...place };

                                // These containers are now in scope from their declaration/assignment above
                                if (reviewsSocialContainer) displayShopReviews(shop.placeDetails, reviewsSocialContainer);
                                if (googlePhotosContainer) displayGooglePlacePhotos(shop.placeDetails, googlePhotosContainer);
                                // openingHoursContainer is for the *other* overlay, but if logic dictates it could be updated too
                                if (openingHoursContainer) displayOpeningHours(shop.placeDetails, openingHoursContainer);
                            } else {
                                if (reviewsSocialContainer) displayShopReviews(null, reviewsSocialContainer);
                                if (googlePhotosContainer) displayGooglePlacePhotos(null, googlePhotosContainer);
                                if (openingHoursContainer) displayOpeningHours(null, openingHoursContainer);
                                console.warn(`Place details (reviews/photos/hours) failed for ${shop.Name}: ${status}`);
                            }
                        }
                    );
                } else {
                     // Details already exist, use them
                     if (reviewsSocialContainer) displayShopReviews(shop.placeDetails, reviewsSocialContainer);
                     if (googlePhotosContainer) displayGooglePlacePhotos(shop.placeDetails, googlePhotosContainer);
                     if (openingHoursContainer) displayOpeningHours(shop.placeDetails, openingHoursContainer);
                }
            } else {
                 // No GoogleProfileID, so cannot fetch Google specific details
                 if (reviewsSocialContainer) displayShopReviews(null, reviewsSocialContainer); // Show 'unavailable' for reviews
                 if (googlePhotosContainer) displayGooglePlacePhotos(null, googlePhotosContainer); // Show 'unavailable' for photos
                 if (openingHoursContainer) displayOpeningHours(null, openingHoursContainer); // Show 'unavailable' for hours
            }

            let defaultTabTarget;
            if (shop.GoogleProfileID) { defaultTabTarget = 'social-photos-panel'; }
            else if (shop.FacebookPageID) { defaultTabTarget = 'social-facebook-panel'; }
            else if (shop.InstagramUsername && shop.InstagramRecentPostEmbedCode) { defaultTabTarget = 'social-instagram-panel'; }
            else if (shop.TwitterHandle) { defaultTabTarget = 'social-twitter-panel'; }
            else { defaultTabTarget = 'social-photos-panel';  } // Fallback

            const socialTabsContainer = document.getElementById('socialOverlayTabs');
            if (socialTabsContainer) {
                const tabButtons = socialTabsContainer.querySelectorAll('.social-tab-button');
                const tabContents = window.detailsOverlaySocialElement.querySelectorAll('.social-tab-content');
                let defaultButtonActuallyActivated = false;
                tabButtons.forEach(btn => {
                    if (btn.dataset.tabTarget === defaultTabTarget) {
                        btn.classList.add('active-social-tab');
                        btn.setAttribute('aria-selected', 'true');
                        defaultButtonActuallyActivated = true;
                    } else {
                        btn.classList.remove('active-social-tab');
                        btn.setAttribute('aria-selected', 'false');
                    }
                });
                if (!defaultButtonActuallyActivated && tabButtons.length > 0) {
                    tabButtons[0].classList.add('active-social-tab');
                    tabButtons[0].setAttribute('aria-selected', 'true');
                    defaultTabTarget = tabButtons[0].dataset.tabTarget;
                }
                tabContents.forEach(panel => {
                    panel.classList.toggle('hidden', panel.id !== defaultTabTarget);
                });

                if (socialOverlayActuallyOpened) {
                    if (defaultTabTarget === 'social-facebook-panel' && typeof FB !== 'undefined' && FB.XFBML) {
                        if (fbContentContainer && fbContentContainer.querySelector('.fb-page')) { // Use the scoped fbContentContainer
                            setTimeout(() => {
                                FB.XFBML.parse(fbContentContainer);
                            }, 100);
                        }
                    }
                    if (defaultTabTarget === 'social-instagram-panel' && typeof window.instgrm !== 'undefined' && window.instgrm.Embeds) {
                         if (igContentContainer) { // Use the scoped igContentContainer
                             setTimeout(() => {
                                window.instgrm.Embeds.process();
                             }, 150);
                         }
                    }
                }
            }
        } catch (e) { console.error("Error populating LEFT social/reviews/photos overlay tabs:", e); }
    }

    if (shopOverlayActuallyOpened || socialOverlayActuallyOpened) {
        document.body.style.overflow = 'hidden';
    }
}



// In uiLogic.js

function displayOpeningHours(placeDetails, containerElement) {
    if (!containerElement) return;

    if (placeDetails && placeDetails.opening_hours && placeDetails.opening_hours.weekday_text) {
        let hoursHTML = '<ul class="opening-hours-list space-y-1 text-sm text-gray-700">';

        // Optional: Display "Open now" status
        if (typeof placeDetails.opening_hours.isOpen === 'function') { // Check if isOpen method exists
            const isOpenNow = placeDetails.opening_hours.isOpen(); // This considers current time
            if (isOpenNow !== undefined) { // isOpen() might return undefined if not determinable
                 hoursHTML = `<p class="text-sm font-semibold mb-2 ${isOpenNow ? 'text-green-600' : 'text-red-600'}">${isOpenNow ? 'Open now' : 'Closed now'}</p>` + hoursHTML;
            }
        } else if (placeDetails.business_status === "OPERATIONAL" && placeDetails.opening_hours.open_now !== undefined) {
            // Fallback to open_now if isOpen() method isn't available but business is operational
            // (open_now might not be as accurate as isOpen() for future/past times)
            const isOpenNow = placeDetails.opening_hours.open_now;
            hoursHTML = `<p class="text-sm font-semibold mb-2 ${isOpenNow ? 'text-green-600' : 'text-red-600'}">${isOpenNow ? 'Open now' : 'Closed now'}</p>` + hoursHTML;
        }


        placeDetails.opening_hours.weekday_text.forEach(daySchedule => {
            const parts = daySchedule.split(/:\s*(.*)/s); // Split day from hours, robust for multiple hour ranges
            const day = parts[0];
            const hours = parts[1] ? parts[1].trim() : 'Closed'; // Handle if no hours listed after colon

            // Highlight current day (optional, requires knowing the current day)
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const isTodayClass = (day.toLowerCase() === today.toLowerCase()) ? 'font-bold text-blue-600' : '';

            hoursHTML += `
                <li class="flex justify-between ${isTodayClass}">
                    <span>${day}:</span>
                    <span class="text-right">${hours}</span>
                </li>`;
        });
        hoursHTML += '</ul>';
        containerElement.innerHTML = hoursHTML;
    } else if (placeDetails && placeDetails.business_status && placeDetails.business_status !== "OPERATIONAL") {
        let statusMessage = "Hours information not available.";
        if (placeDetails.business_status === "CLOSED_TEMPORARILY") {
            statusMessage = "Temporarily Closed";
        } else if (placeDetails.business_status === "CLOSED_PERMANENTLY") {
            statusMessage = "Permanently Closed";
        }
        containerElement.innerHTML = `<p class="text-sm text-red-500 font-semibold text-center p-2">${statusMessage}</p>`;
    }

    else {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 text-center p-2">Hours information not available.</p>';
    }
}

function closeClickedShopOverlays() {
    let anOverlayWasOpen = false;
    if (detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open')) {
        closeOverlay(detailsOverlayShopElement); anOverlayWasOpen = true;
    }
    if (detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open')) {
        closeOverlay(detailsOverlaySocialElement); anOverlayWasOpen = true;
    }

    if (anOverlayWasOpen) {
        if (typeof infowindow !== 'undefined' && infowindow && typeof infowindow.close === 'function') {
            infowindow.close();
        }
        document.body.style.overflow = '';
        currentShopForDirections = null;

        const fbContent = document.getElementById('socialLinksContainer');
        if (fbContent) { fbContent.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Loading Facebook feed...</p>'; fbContent.dataset.currentPageId = ''; }
        const twContent = document.getElementById('twitterTimelineContainer');
        if (twContent) { twContent.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Loading Twitter feed...</p>'; twContent.dataset.currentTwitterHandle = ''; }
        const igContent = document.getElementById('instagramFeedContainer');
        if (igContent) {
            igContent.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Instagram content will load here.</p>';
            igContent.dataset.currentInstaUser = '';
        }
        const reviewsSocialContainer = document.getElementById('socialOverlayReviewsContainer');
        if(reviewsSocialContainer) reviewsSocialContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Loading reviews...</p>';
        const googlePhotosContainer = document.getElementById('socialOverlayGooglePhotosContainer');
        if(googlePhotosContainer) googlePhotosContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 col-span-full text-center">Loading Google Photos...</p>';
    }
}

function sortShopsByDistanceGoogle(shops, mapCenter) {
    if (!google || !google.maps || !google.maps.geometry || !google.maps.geometry.spherical) {
        return shops.map(s => ({ ...s, distance: Infinity }));
    }
    if (!mapCenter || !shops || shops.length === 0) {
        return shops.map(s => ({ ...s, distance: Infinity }));
    }
    return shops.map(shop => {
        const shopLat = parseFloat(shop.lat);
        const shopLng = parseFloat(shop.lng);
        if (!isNaN(shopLat) && !isNaN(shopLng)) {
            const shopLocation = new google.maps.LatLng(shopLat, shopLng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLocation);
            return { ...shop, distance: distance };
        }
        return { ...shop, distance: Infinity };
    }).sort((a, b) => a.distance - b.distance);
}

function generateShopContentHTML(shop, context = 'card') {
    if (!shop) return '<p>Shop data unavailable.</p>';

    let actualImageUrl;
    const placeholderText = encodeURIComponent(shop.Name.split(' ').slice(0, 2).join(' ') || 'Farm Stand');
    const fallbackImageUrlCard = `https://placehold.co/400x250/E0E0E0/757575?text=${placeholderText}&font=inter`;
    const fallbackImageUrlBubble = `https://placehold.co/280x150/E0E0E0/757575?text=${placeholderText}&font=inter`;

    if (shop.ImageOne && typeof shop.ImageOne === 'string' && shop.ImageOne.trim() !== '') {
        actualImageUrl = `images/${shop.ImageOne.trim()}`;
    } else {
        actualImageUrl = (context === 'card') ? fallbackImageUrlCard : fallbackImageUrlBubble;
    }

    let finalImageHTML = '';
    if (context === 'card') {
        finalImageHTML = `<div class="aspect-w-16 aspect-h-9 sm:aspect-h-7"><img class="w-full h-full object-cover" loading="lazy" src="${actualImageUrl}" alt="Image of ${shop.Name}" onerror="this.onerror=null; this.src='${fallbackImageUrlCard}';"></div>`;
    } else if (context === 'infowindow' && shop.ImageOne && shop.ImageOne.trim() !== '') {
        // MODIFIED: Added mb-1 for spacing below image in infowindow, similar to card's implicit spacing
        finalImageHTML = `<img class="w-full h-auto object-cover rounded-t-sm mb-1" style="max-height: 150px;" src="${actualImageUrl}" alt="Image of ${shop.Name}" onerror="this.style.display='none';">`;
    }

    let starsAndRatingHTML = getStarRatingHTML("N/A");
    let ratingSource = shop.placeDetails;
    if (!ratingSource && shop.Rating && shop.Rating !== "N/A") {
        starsAndRatingHTML = getStarRatingHTML(shop.Rating);
    } else if (ratingSource && typeof ratingSource.rating === 'number') {
        starsAndRatingHTML = getStarRatingHTML(ratingSource.rating, ratingSource.user_ratings_total);
    }
    const ratingContainerId = `rating-for-${shop.GoogleProfileID || (shop.Name + (shop.Address || '')).replace(/[^a-zA-Z0-9]/g, '-')}-${context}`;

    // MODIFIED: Adjust classes for infowindow to be scaled versions of card
    const iconMarginClass = (context === 'infowindow') ? "mr-1" : "mr-2";
    const iconClasses = `w-3.5 h-3.5 ${iconMarginClass} text-gray-400 flex-shrink-0`;

    const rowTextClasses = "text-sm text-gray-600 truncate"; // Kept same as card, font-size: 13px on wrapper helps
    const rowContainerClasses = "flex items-center";

    // MODIFIED: Scaled down space-y and mt for infowindow
    const detailRowsOuterDivClasses = (context === 'infowindow') ? "space-y-1 mt-1" : "space-y-1 mt-2";
    let detailRowsHTML = `<div class="${detailRowsOuterDivClasses}">`;


    if (shop.Address && shop.Address !== 'N/A') {
        detailRowsHTML += `
            <div class="${rowContainerClasses}" title="${shop.Address}">
                <svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                <span class="${rowTextClasses}">${shop.Address}</span>
            </div>`;
    }

    let distanceString = '';
    if (shop.distance !== undefined && shop.distance !== Infinity && shop.distance !== null) {
        const distKm = (shop.distance / 1000); const distMiles = kmToMiles(distKm);
        distanceString = `~${distMiles.toFixed(1)} mi / ${distKm.toFixed(1)} km away`;
    } else if (context === 'infowindow' && typeof map !== 'undefined' && map && map.getCenter() && shop.lat && shop.lng) {
        try {
            const shopLoc = new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng));
            const mapCenter = map.getCenter();
            if (shopLoc && mapCenter) {
                const distMeters = google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLoc);
                const distKm = (distMeters / 1000); const distMiles = kmToMiles(distKm);
                distanceString = `~${distMiles.toFixed(1)} mi / ${distKm.toFixed(1)} km from map center`;
            }
        } catch(e) { /* silent */ }
    }
    if (distanceString) {
         detailRowsHTML += `
            <div class="${rowContainerClasses}" title="${distanceString}">
                <svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12 1.5a.75.75 0 01.75.75V3h1.25A2.75 2.75 0 0116.75 5.75v8.5A2.75 2.75 0 0114 17H6a2.75 2.75 0 01-2.75-2.75V5.75A2.75 2.75 0 016 3h1.25V2.25A.75.75 0 018 1.5h4zm-.22 6.22a.75.75 0 00-1.06-1.06L9.25 8.19V5.75a.75.75 0 00-1.5 0V8.19L6.28 6.72a.75.75 0 00-1.06 1.06L6.94 9.5l-1.72 1.72a.75.75 0 101.06 1.06L7.75 10.81v2.44a.75.75 0 001.5 0v-2.44l1.47 1.47a.75.75 0 001.06-1.06L10.06 9.5l1.72-1.72z" clip-rule="evenodd"></path></svg>
                <span class="${rowTextClasses} text-blue-600">${distanceString}</span>
            </div>`;
    }

    if (shop.Phone) {
        detailRowsHTML += `
            <div class="${rowContainerClasses}" title="${shop.Phone}">
                 <svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                 <a href="tel:${shop.Phone}" onclick="${context === 'card' ? 'event.stopPropagation();' : ''}" target="_blank" class="${rowTextClasses} text-blue-600 hover:text-blue-800 hover:underline break-all"><span class="truncate">${shop.Phone}</span></a>
            </div>`;
    }

    if (shop.Website && shop.Website.trim() !== '' && !shop.Website.includes('googleusercontent.com')) {
        let displayWebsite = shop.Website;
        try {
            const urlObject = new URL(displayWebsite.startsWith('http') ? displayWebsite : `http://${displayWebsite}`);
            displayWebsite = urlObject.hostname.replace(/^www\./,'');
            const maxLength = context==='infowindow'?20:30;
            if(displayWebsite.length > maxLength) displayWebsite = displayWebsite.substring(0,maxLength-3)+"...";
        } catch(e){
            const maxLength=context==='infowindow'?20:30;
            if(displayWebsite.length > maxLength) displayWebsite = displayWebsite.substring(0,maxLength-3)+"...";
        }
        detailRowsHTML += `
            <div class="${rowContainerClasses}" title="${shop.Website}">
                <svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-4-4a2 2 0 012.828-2.828l3 3a2 2 0 010 2.828l-2.086 2.086a.5.5 0 01-.707-.707L11.172 8.172l1.414-1.414-3-3a.5.5 0 01.707-.707l3 3zm4.707-1.414a3 3 0 00-4.242 0l-3 3a3 3 0 000 4.242l4 4a3 3 0 004.242 0l3-3a3 3 0 000-4.242l-3-3z" clip-rule="evenodd"></path></svg>
                <a href="${shop.Website.startsWith('http')?shop.Website:`http://${shop.Website}`}" target="_blank" rel="noopener noreferrer" onclick="${context === 'card' ? 'event.stopPropagation();' : ''}" class="${rowTextClasses} text-blue-600 hover:text-blue-800 hover:underline break-all"><span class="truncate">${displayWebsite}</span></a>
            </div>`;
    }
    detailRowsHTML += '</div>';


    let googleMapsLinkHTML = '';
    // if (context === 'infowindow' && shop.placeDetails && shop.placeDetails.url) {
    //     googleMapsLinkHTML = `<div class="mt-3 pt-2 border-t border-gray-200"><a href="${shop.placeDetails.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-full px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M19.167 2.5a.833.833 0 00-1.08-.433L7.03 6.213a.833.833 0 00-.25.368l-2.5 8.333a.833.833 0 00.886 1.09l2.494-.754a.833.833 0 00.612-.135l8.582-6.26a.833.833 0 00.393-.78V2.5zM8.583 7.276l7.402-4.012v2.752l-7.402 4.011V7.276zm-1.416 4.97L3.75 13.58v-3.055l3.417-1.858v4.579zM10 18.333A8.333 8.333 0 1010 1.667a8.333 8.333 0 000 16.666z"/></svg>View on Google Maps</a></div>`;
    // }

    const nameSizeClass = (context === 'card') ? "text-base sm:text-lg" : "text-md";
    // MODIFIED: Overall padding and individual margins for infowindow
    const textContentPaddingClass = (context === 'card') ? "p-3 sm:p-4" : "p-2"; // p-2 for infowindow
    const nameMarginClass = "mb-1"; // Same for both, but font size is smaller in infowindow
    const ratingMarginClass = (context === 'infowindow') ? "mb-1" : "mb-2"; // Scaled down for infowindow


    const textAndContactContent = `
        <div class="${textContentPaddingClass} flex-grow flex flex-col">
            <h2 class="${nameSizeClass} font-semibold text-gray-800 leading-tight truncate ${nameMarginClass}" title="${shop.Name}">${shop.Name}</h2>
            <div id="${ratingContainerId}" class="shop-card-rating ${ratingMarginClass}">${starsAndRatingHTML}</div>
            ${detailRowsHTML}
            <div class="mt-auto">
                ${googleMapsLinkHTML}
            </div>
        </div>`;

    if (context === 'infowindow') {
        return `<div class="infowindow-content-wrapper flex flex-col" style="font-family: 'Inter', sans-serif; max-width: 280px; font-size: 13px; min-height:150px;">${finalImageHTML}${textAndContactContent}</div>`;
    }
    return `<div class="flex flex-col h-full">${finalImageHTML}${textAndContactContent}</div>`;
}

function handleInfoWindowDirectionsClick(shopData) {
    if (typeof openClickedShopOverlays === 'function') {
        openClickedShopOverlays(shopData);
    }
    setTimeout(() => {
        if (typeof handleGetDirections === 'function') {
            handleGetDirections(shopData);
        }
    }, 150);
}

function renderListings(shopsToRender, performSort = true, sortCenter = null) {
    if (!listingsPanelElement) { console.error("Listings panel element not found."); return; }
    if (!listingsContainer) { console.error("Listings container element not found."); return; }
    let shopsForDisplay = [...shopsToRender];
    const currentCenterForSort = sortCenter || (typeof map !== 'undefined' && map ? map.getCenter() : null);
    if (performSort && currentCenterForSort) {
        shopsForDisplay = sortShopsByDistanceGoogle(shopsForDisplay, currentCenterForSort);
    }
    window.currentlyDisplayedShops = shopsForDisplay;
    listingsContainer.innerHTML = '';

    if (shopsForDisplay.length > 0) {
        if (noResultsDiv) noResultsDiv.classList.add('hidden');
        listingsContainer.classList.remove('hidden');

        shopsForDisplay.forEach(shop => {
            const card = document.createElement('div');
            const shopIdentifier = shop.GoogleProfileID || (shop.Name + (shop.Address || '')).replace(/[^a-zA-Z0-9]/g, '-');
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer group w-full flex flex-col h-full';
            card.setAttribute('data-shop-id', shopIdentifier);
            card.innerHTML = generateShopContentHTML(shop, 'card');

            const ratingContainerIdForCard = `rating-for-${shopIdentifier}-card`;
            const ratingDivInCard = card.querySelector(`#${ratingContainerIdForCard}`);

            if (!shop.placeDetails && shop.GoogleProfileID && typeof placesService !== 'undefined' && typeof google !== 'undefined') {
                if (!shop._isFetchingCardDetails) {
                    shop._isFetchingCardDetails = true;
                    placesService.getDetails({ placeId: shop.GoogleProfileID, fields: ['rating', 'user_ratings_total'] },
                        (place, status) => {
                            shop._isFetchingCardDetails = false;
                            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                                shop.placeDetails = { ...shop.placeDetails, rating: place.rating, user_ratings_total: place.user_ratings_total };
                                if (ratingDivInCard) ratingDivInCard.innerHTML = getStarRatingHTML(place.rating, place.user_ratings_total);
                            }
                        }
                    );
                }
            } else if (shop.placeDetails && ratingDivInCard) {
                 ratingDivInCard.innerHTML = getStarRatingHTML(shop.placeDetails.rating, shop.placeDetails.user_ratings_total);
            }


            card.addEventListener('click', () => {
                if (typeof openClickedShopOverlays === 'function') openClickedShopOverlays(shop);
                setTimeout(() => { if (typeof showInfoWindowForShop === 'function') showInfoWindowForShop(shop); }, 100);

                document.querySelectorAll('#listingsContainer .bg-white.rounded-xl').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'));
                card.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            });
            listingsContainer.appendChild(card);
        });
    } else {
        if (noResultsDiv) {
            const searchVal = (typeof searchInput !== 'undefined' && searchInput) ? searchInput.value : "";
            let noResultsMessage = 'No farm stands found.';
            if (searchVal.trim() !== "") noResultsMessage += ` Try broadening your search or adjusting filters.`;
            else if (Object.values(window.activeProductFilters || {}).some(v => v)) noResultsMessage += ` Try adjusting your filters.`; // Added check for active filters
            else if (typeof GOOGLE_SHEET_DIRECT_URL !== 'undefined' && GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER) noResultsMessage = 'Data source not configured.';
            noResultsDiv.textContent = noResultsMessage;
            noResultsDiv.classList.remove('hidden');
        }
        listingsContainer.classList.add('hidden');
    }
}

function populateInstagramTab(shop, instagramFeedContainerElement) {
    if (!instagramFeedContainerElement) {
        console.error("populateInstagramTab: instagramFeedContainerElement is null");
        return;
    }
    console.log("Populating Instagram tab for:", shop.Name, ". Embed code available:", !!shop.InstagramRecentPostEmbedCode, ". Username:", shop.InstagramUsername);

    const username = shop.InstagramUsername;
    const embedCode = shop.InstagramRecentPostEmbedCode;

    if (username && username.trim() !== '' && embedCode && embedCode.trim() !== '') {
        const cleanUsername = username.replace('@', '').trim();
        console.log("Instagram - Using embed code for:", cleanUsername);

        instagramFeedContainerElement.innerHTML = embedCode;

        const profileLink = document.createElement('a');
        profileLink.href = shop.InstagramLink || `https://www.instagram.com/${cleanUsername}/`;
        profileLink.target = "_blank";
        profileLink.rel = "noopener noreferrer";
        profileLink.className = "block text-center mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm";
        profileLink.innerHTML = `<svg class="inline-block w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997-1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068-1.18.053-1.847.28-2.377.48-.575.222-1.018.567-1.465 1.015-.447.447-.793.89-1.015 1.464-.2.53-.427 1.197-.48 2.378C2.024 8.556 2.012 8.925 2.012 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377.222.575.567 1.018 1.015 1.465.447.447.89.793 1.464 1.015.53.2 1.197.427 2.378.48 1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847.28 2.377-.48.575.222 1.018.567 1.465 1.015.447.447.793-.89 1.015 1.464.2-.53.427-1.197-.48-2.378.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377-.222-.575-.567-1.018-1.015-1.465-.447-.447-.793-.89-1.015-1.464-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg>View @${cleanUsername} on Instagram`;
        instagramFeedContainerElement.appendChild(profileLink);

    } else if (username && username.trim() !== '') {
         const cleanUsername = username.replace('@', '').trim();
         console.log("Instagram - Username found, but no embed code for:", cleanUsername);
         instagramFeedContainerElement.innerHTML = `<p class="text-sm text-gray-500 p-4">No recent post embed code found for @${cleanUsername}.</p>
            <a href="${shop.InstagramLink || `https://www.instagram.com/${cleanUsername}/`}" target="_blank" rel="noopener noreferrer" class="block text-center mt-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm">
            <svg class="inline-block w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997-1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068-1.18.053-1.847.28-2.377.48-.575.222-1.018.567-1.465 1.015-.447.447-.793.89-1.015 1.464-.2.53-.427 1.197-.48 2.378C2.024 8.556 2.012 8.925 2.012 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377.222.575.567 1.018 1.015 1.465.447.447.89.793 1.464 1.015.53.2 1.197.427 2.378.48 1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847.28 2.377-.48.575.222 1.018.567 1.465 1.015.447.447.793-.89 1.015 1.464.2-.53.427-1.197-.48-2.378.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377-.222-.575-.567-1.018-1.015-1.465-.447-.447-.793-.89-1.015-1.464-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg>View @${cleanUsername} on Instagram</a>`;
    } else {
        console.log("Instagram - No username available. Setting no profile message.");
        instagramFeedContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Instagram profile configured.</p>';
    }
}

function handleGetDirections(shop) {
    if (!shop) { alert("Shop data not available for directions."); return; }
    let destinationPayload = {};
    if (shop.lat && shop.lng) {
        destinationPayload = { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng), Name: shop.Name };
    } else if (shop.GoogleProfileID) {
        destinationPayload = { GoogleProfileID: shop.GoogleProfileID, Name: shop.Name };
    } else if (shop.Address && shop.Address !== 'N/A') {
        destinationPayload = { Address: shop.Address, Name: shop.Name };
    } else {
        alert("Not enough information for directions for " + shop.Name); return;
    }

    if (typeof calculateAndDisplayRoute === 'function') {
        calculateAndDisplayRoute(destinationPayload);
    } else {
        console.error("calculateAndDisplayRoute function not found.");
        alert("Directions functionality unavailable.");
    }
}

function displayShopReviews(placeDetails, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = ''; // Clear previous content

    let summaryHTML = '';
    let reviewDistributionHTML = ''; // For the star breakdown bars

    if (placeDetails && typeof placeDetails.rating === 'number' && typeof placeDetails.user_ratings_total === 'number') {
        const ratingValue = placeDetails.rating.toFixed(1);
        const totalReviews = placeDetails.user_ratings_total.toLocaleString();
        const starsVisual = getStarsVisualHTML(placeDetails.rating, 'w-5 h-5 text-yellow-400');

        summaryHTML = `
            <div class="place-review-summary p-4 mb-4 border-b border-gray-200">
                <div class="flex items-center gap-x-3 sm:gap-x-4">
                    <div class="flex-shrink-0">
                        <p class="text-4xl sm:text-5xl font-bold text-gray-800">${ratingValue}</p>
                    </div>
                    <div class="flex flex-col">
                        <div class="stars-container">
                            ${starsVisual}
                        </div>
                        <p class="text-xs sm:text-sm text-gray-600 mt-1">${totalReviews} reviews</p>
                    </div>
                </div>
            </div>
        `;

        // --- START: Calculate and Generate Review Distribution Bars (from sampled reviews) ---
        if (placeDetails.reviews && placeDetails.reviews.length > 0) {
            const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            let sampleTotal = 0;
            placeDetails.reviews.forEach(review => {
                const r = Math.round(review.rating); // Round to nearest integer star
                if (r >= 1 && r <= 5) {
                    starCounts[r]++;
                    sampleTotal++;
                }
            });

            if (sampleTotal > 0) {
                reviewDistributionHTML = '<div class="review-distribution-bars px-4 mb-4 text-sm">';
                // Optional: Add a note about the data source
                // reviewDistributionHTML += `<p class="text-xs text-gray-500 mb-2 italic">Distribution based on ${sampleTotal} shown reviews:</p>`;

                for (let i = 5; i >= 1; i--) {
                    const count = starCounts[i];
                    const percentage = (count / sampleTotal) * 100;
                    // Tailwind classes for the bar. Adjust width based on percentage.
                    // bg-yellow-400 for the filled part, bg-gray-200 for the track
                    reviewDistributionHTML += `
                        <div class="flex items-center gap-x-2 mb-1">
                            <span class="w-2 text-right text-gray-600">${i}</span>
                            <div class="flex-grow bg-gray-200 rounded-full h-2.5">
                                <div class="bg-yellow-400 h-2.5 rounded-full" style="width: ${percentage.toFixed(1)}%;"></div>
                            </div>
                        </div>
                    `;
                }
                reviewDistributionHTML += '</div>';
            }
        }
        // --- END: Calculate and Generate Review Distribution Bars ---
    }


    if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'space-y-3 px-4'; // Added px-4 for consistency with summary padding
        placeDetails.reviews.slice(0, 5).forEach(review => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 rounded-md shadow-sm';
            const starsDisplayForIndividualReview = getStarRatingHTML(review.rating);

            let reviewHTML = `
                <div class="flex items-center mb-1">
                    ${review.profile_photo_url ? `<img src="${review.profile_photo_url.replace(/=s\d+(-c)?/, '=s40-c')}" alt="${review.author_name}" class="w-8 h-8 rounded-full mr-2">` : '<div class="w-8 h-8 rounded-full mr-2 bg-gray-200 flex items-center justify-center text-gray-400 text-xs"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clip-rule="evenodd" /></svg></div>'}
                    <strong class="text-sm text-gray-700 truncate" title="${review.author_name}">${review.author_name}</strong>
                    <span class="ml-auto text-xs text-gray-500 whitespace-nowrap">${review.relative_time_description}</span>
                </div>
                <div class="review-stars-individual mb-1">${starsDisplayForIndividualReview}</div>
                <p class="text-xs text-gray-600 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer" title="Click to expand/collapse review">${review.text || ''}</p>`;
            li.innerHTML = reviewHTML;
            const reviewTextP = li.querySelector('p.text-xs');
            if (reviewTextP) {
                 reviewTextP.addEventListener('click', () => reviewTextP.classList.toggle('line-clamp-3'));
            }
            ul.appendChild(li);
        });

        // Prepend summary and distribution, then add reviews list
        containerElement.innerHTML = summaryHTML + reviewDistributionHTML; // Add summary and distribution first
        containerElement.appendChild(ul); // Then append the reviews list

         if (placeDetails.reviews.length > 5 || (placeDetails.url && placeDetails.reviews.length > 0)) {
            const viewMoreLink = document.createElement('a');
            viewMoreLink.href = placeDetails.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeDetails.name || '')}&query_place_id=${placeDetails.place_id || ''}`;
            viewMoreLink.target = "_blank";
            viewMoreLink.rel = "noopener noreferrer";
            viewMoreLink.className = "block text-center text-xs text-blue-600 hover:underline mt-3 pt-2 border-t border-gray-200 mx-4"; // Added mx-4
            viewMoreLink.textContent = `View all ${placeDetails.user_ratings_total ? placeDetails.user_ratings_total.toLocaleString() : ''} reviews on Google Maps`;
            containerElement.appendChild(viewMoreLink);
        }

    } else {
        // If no reviews, but we have summary data (and potentially distribution if we had reviews earlier)
        let contentToShow = summaryHTML + reviewDistributionHTML;
        if (contentToShow) {
            containerElement.innerHTML = contentToShow + '<p class="text-sm text-gray-500 p-4 text-center">No Google reviews found to display individually.</p>';
        } else {
            containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Google reviews or rating summary available for this shop.</p>';
        }
    }
}

function generateProductIconsHTML(shop) { // Changed argument to 'shop'
    if (!shop) { // Basic check for the shop object
        return '<p class="text-sm text-gray-500 text-center p-2 col-span-full">Shop data not available for products.</p>';
    }

    let iconsHTML = '<div id="shopProductIconsGrid" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">';
    let displayedIconCount = 0;

    for (const internalKey in PRODUCT_ICONS_CONFIG) {
        const config = PRODUCT_ICONS_CONFIG[internalKey];
        // config.csvHeader is now the direct property name on the shop object (e.g., 'beef', 'pork')
        const productPropertyKey = config.csvHeader;

        let iconFileToUse = config.icon_unavailable;
        let itemClasses = "product-icon-item flex flex-col items-center text-center p-1 opacity-50";
        let altText = `${config.name} (not listed)`;

        // Check if the shop object has the property and if it's true
        if (shop.hasOwnProperty(productPropertyKey) && shop[productPropertyKey] === true) {
            displayedIconCount++; // Increment only if available and displayed with active icon
            iconFileToUse = config.icon_available;
            itemClasses = "product-icon-item flex flex-col items-center text-center p-1 rounded-md hover:bg-gray-100 transition-colors";
            altText = config.name;
        }
        // Always render an icon container (either active or inactive style)
        iconsHTML += `
            <div class="${itemClasses}">
                <img src="images/icons/${iconFileToUse}" alt="${altText}" class="w-12 h-12 sm:w-14 sm:h-14 object-contain mb-1">
                <span class="text-xs font-medium text-gray-700">${config.name}</span>
            </div>
        `;
    }

    if (Object.keys(PRODUCT_ICONS_CONFIG).length === 0) {
        iconsHTML = '<p class="text-sm text-gray-500 text-center p-2 col-span-full">No product categories configured to display.</p>';
    } else if (displayedIconCount === 0 && Object.keys(PRODUCT_ICONS_CONFIG).length > 0) {
        // If you prefer to show a message when NO products are available for THIS shop, even if icons are shown faded:
        // iconsHTML += '</div><p class="text-sm text-gray-500 text-center p-2 col-span-full">No featured products available for this shop.</p>';
        // For now, we always show the grid.
        iconsHTML += '</div>';
    } else {
        iconsHTML += '</div>'; // Close shopProductIconsGrid
    }
    return iconsHTML;
}