// js/uiLogic.js
document.addEventListener('DOMContentLoaded', () => {
    window.detailsOverlayShopElement = document.getElementById('detailsOverlayShop');
    window.detailsOverlaySocialElement = document.getElementById('detailsOverlaySocial');
    // Add other elements as needed, e.g.:
    window.shopDetailNameElement = document.getElementById('shopDetailName');
    window.shopDetailRatingStarsElement = document.getElementById('shopDetailRatingStars');
    window.shopDetailAddressElement = document.getElementById('shopDetailAddress');
    window.shopDetailPhoneElement = document.getElementById('shopDetailPhone');
    window.shopDetailWebsiteElement = document.getElementById('shopDetailWebsite');
    window.shopDetailMapLinkContainerElement = document.getElementById('shopDetailMapLinkContainer');
    window.shopDetailDistanceElement = document.getElementById('shopDetailDistance');
    window.socialLinksContainerElement = document.getElementById('socialLinksContainer');
    window.twitterTimelineContainerElement = document.getElementById('twitterTimelineContainer');
    // NEW: Event listener for the "Get Directions" button in the overlay
    const getDirectionsBtnOverlay = document.getElementById('getShopDirectionsButton');
    if (getDirectionsBtnOverlay) {
        getDirectionsBtnOverlay.addEventListener('click', () => {
            if (currentShopForDirections) {
                handleGetDirections(currentShopForDirections);
            } else {
                console.error("No shop selected to get directions for.");
                alert("Please select a shop first.");
            }
        });
    }

    // NEW: Event listener for the "Clear Directions" button
    const clearDirectionsBtn = document.getElementById('clearShopDirectionsButton');
    if (clearDirectionsBtn) {
        clearDirectionsBtn.addEventListener('click', () => {
            if (typeof clearDirections === 'function') { // clearDirections is in mapLogic.js
                clearDirections();
            }
        });
    }
});


// DOM element variables will be defined in main.js and accessed globally here
function openOverlay(overlay) {
    if (!overlay) return; // Guard clause
    overlay.classList.remove('hidden');
    overlay.classList.add('is-open');
}
function closeOverlay(overlay) {
    if (!overlay) return; // Guard clause
    overlay.classList.remove('is-open');
    overlay.classList.add('hidden');
}

function getStarRatingHTML(ratingString, originalNumericRating) { // Added originalNumericRating
    const rating = parseFloat(ratingString);
    if (ratingString === "N/A" || isNaN(rating)) { // Handle explicit "N/A" or actual NaN
        return `<span class="text-sm text-gray-400">No rating</span>`;
    }
    const rounded = Math.round(rating);
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < rounded ? '★' : '☆';

    // If originalNumericRating is provided and valid, display it. Otherwise, fallback to ratingString if needed.
    const displayRatingValue = (typeof originalNumericRating === 'number' && !isNaN(originalNumericRating))
                               ? originalNumericRating.toFixed(1)
                               : (!isNaN(rating) ? rating.toFixed(1) : ratingString);

    // The (ratingValue) part is now conditionally added by reviewCountText or this function.
    // If reviewCountText will be present, we might not need to add (${displayRatingValue}) here.
    // For now, let's keep it, assuming reviewCountText might be empty sometimes.
    return `<span class="text-yellow-400 text-lg">${stars}</span> <span class="text-gray-500 text-xs ml-1">(${displayRatingValue})</span>`;
}
/**
 * Generates HTML for embedding a Facebook Page's timeline using the Facebook Page Plugin.
 *
 * @param {string} pageId - The Facebook Page ID (e.g., "SacoRiverFarms" or a numeric ID).
 * @param {string} pageName - The name of the Facebook Page to display.
 * @returns {string} HTML string for the Facebook Page Plugin, or an error comment if pageId is missing.
 */
function generateFacebookPagePluginHTML(pageId, pageName) {
    if (!pageId) {
        console.error("Cannot generate Page Plugin: Page ID is missing.");
        return '<!-- Error: Facebook Page ID is missing. -->';
    }

    const facebookPageLink = `https://www.facebook.com/${pageId}/`;
    // Use provided pageName, or fallback to the pageId if name is not available/passed
    const displayName = pageName || pageId;

    // Ensure data-width and data-height are empty for adaptive sizing, or set specific values if needed.
    const pluginHTML = `
<div class="fb-page"
     data-href="${facebookPageLink}"
     data-tabs="timeline"
     data-width="" 
     data-height="500" 
     data-small-header="true"
     data-adapt-container-width="true"
     data-hide-cover="true"
     data-show-facepile="true">
    <blockquote cite="${facebookPageLink}" class="fb-xfbml-parse-ignore">
        <a href="${facebookPageLink}">${displayName}</a>
    </blockquote>
</div>`;
    return pluginHTML;
}







// In uiLogic.js

function displayTwitterTimeline(twitterHandle, containerElement) {
    if (!containerElement) {
        console.error("TWITTER DEBUG: Twitter container element not found.");
        return;
    }

    containerElement.innerHTML = ''; // Clear previous content first

    if (!twitterHandle || typeof twitterHandle !== 'string' || twitterHandle.trim() === '') {
        console.log("TWITTER DEBUG: No valid Twitter handle provided.", twitterHandle);
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Twitter handle configured for this shop.</p>';
        return;
    }

    const cleanHandle = twitterHandle.replace('@', '').trim();
    if (!cleanHandle) {
        console.log("TWITTER DEBUG: Cleaned Twitter handle is empty.", twitterHandle);
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">Invalid Twitter handle configured.</p>';
        return;
    }

    console.log(`TWITTER DEBUG: Attempting to embed timeline for: @${cleanHandle}`); // <<< YOU SEE THIS
    containerElement.innerHTML = `<p class="text-sm text-gray-400 p-4">Loading Twitter feed for @${cleanHandle}...</p>`; 

    if (typeof twttr === 'undefined' || !twttr.widgets || typeof twttr.widgets.createTimeline !== 'function') {
        console.error("TWITTER DEBUG: Twitter widgets script (twttr.widgets or createTimeline) not ready or loaded.", typeof twttr !== 'undefined' ? twttr : 'twttr is undefined');
        containerElement.innerHTML = '<p class="text-sm text-red-500 p-4">Twitter embedding script not available. Please ensure it has loaded from platform.twitter.com.</p>';
        return;
    }

    console.log("TWITTER DEBUG: 'twttr' object seems valid. ABOUT TO CALL createTimeline.", twttr); // <<< ADD THIS

    try {
        const promise = twttr.widgets.createTimeline( // Assign to a variable
            {
                sourceType: 'profile',
                screenName: cleanHandle
            },
            containerElement,
            {
                height: '450',
                theme: 'light',
                chrome: 'noheader nofooter noborders noscrollbar transparent',
                tweetLimit: 5
            }
        );

        console.log("TWITTER DEBUG: createTimeline call MADE. Promise object:", promise); // <<< ADD THIS

        if (!promise || typeof promise.then !== 'function') {
            console.error("TWITTER DEBUG: createTimeline did not return a valid promise!");
            containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Twitter widget creation failed to start properly.</p>`;
            return;
        }

        promise.then(function (el) {
            console.log("TWITTER DEBUG: createTimeline.then callback received. Element:", el); // <<< YOU DON'T SEE THIS
            if (el) {
                console.log("TWITTER DEBUG: Twitter timeline embedded for @" + cleanHandle);
                if (containerElement.childNodes.length === 0 || (containerElement.childNodes.length === 1 && containerElement.firstChild.tagName === 'P')) {
                     containerElement.innerHTML = `<p class="text-sm text-orange-500 p-4">Timeline for @${cleanHandle} script processed, but content might be empty or restricted. Check handle & privacy settings.</p>`;
                }
            } else {
                console.warn("TWITTER DEBUG: Twitter timeline could not be embedded for @" + cleanHandle + ". 'el' is falsy.");
                containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Could not embed Twitter timeline for @${cleanHandle}. The account may be private, suspended, or the handle incorrect.</p>`;
            }
        }).catch(function (e) {
            console.error("TWITTER DEBUG: Error creating Twitter timeline for @" + cleanHandle + ":", e); // <<< YOU DON'T SEE THIS
            containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">An error occurred while trying to embed the Twitter timeline for @${cleanHandle}. Details in console.</p>`;
        });
    } catch (error) {
        console.error("TWITTER DEBUG: Synchronous error calling twttr.widgets.createTimeline:", error); // <<< YOU DON'T SEE THIS
        containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Failed to initiate Twitter timeline embedding. Twitter script might be missing or broken.</p>`;
    }
}





    

// js/uiLogic.js

// js/uiLogic.js

async function openClickedShopOverlays(shop) {
    console.log("UILOGIC: openClickedShopOverlays initiated for shop:", shop ? shop.Name : "No shop data");
    if (!shop) {
        console.error("Critical Error: Shop data is null. Cannot open overlays.");
        return;
    }

    // Open the main overlays
    let shopOverlayActuallyOpened = false;
    let socialOverlayActuallyOpened = false;

    if (detailsOverlayShopElement) {
        openOverlay(detailsOverlayShopElement); // This function should add 'is-open' and remove 'hidden'
        detailsOverlayShopElement.scrollTop = 0;
        shopOverlayActuallyOpened = true;
        console.log("UILOGIC: detailsOverlayShopElement instructed to open.");
    } else {
        console.error("UILOGIC: detailsOverlayShopElement not found!");
    }

    if (detailsOverlaySocialElement) {
        openOverlay(detailsOverlaySocialElement);
        detailsOverlaySocialElement.scrollTop = 0;
        socialOverlayActuallyOpened = true;
        console.log("UILOGIC: detailsOverlaySocialElement instructed to open.");
    } else {
        console.error("UILOGIC: detailsOverlaySocialElement not found!");
    }

    // Populate Right Overlay (Shop Details - Name, Images, Reviews)
    if (shopOverlayActuallyOpened && detailsOverlayShopElement) {
        try {
            if (shopDetailNameElement) {
                shopDetailNameElement.textContent = shop.Name || 'N/A';
            }

            const galleryContainer = document.getElementById('shopImageGallery');
            if (galleryContainer) {
                galleryContainer.innerHTML = '';
                const imageFilenames = [];
                if (shop.ImageOne) imageFilenames.push(shop.ImageOne); // Assuming these are filenames from CSV
                if (shop.ImageTwo) imageFilenames.push(shop.ImageTwo);
                if (shop.ImageThree) imageFilenames.push(shop.ImageThree);

                if (imageFilenames.length > 0) {
                    imageFilenames.forEach(filename => {
                        if (!filename || !filename.trim()) return;
                        const trimmedFilename = filename.trim();
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'gallery-image-container';
                        const img = document.createElement('img');
                        img.src = `images/${trimmedFilename}`;
                        // console.log("Attempting to load image:", img.src);
                        img.alt = `${shop.Name || 'Shop'} image - ${trimmedFilename}`;
                        img.className = 'gallery-image';
                        img.onerror = function() {
                            this.style.display = 'none';
                            const errorText = document.createElement('p');
                            errorText.textContent = 'Image not available';
                            errorText.className = 'text-xs text-gray-500 text-center';
                            while (imgContainer.firstChild) { imgContainer.removeChild(imgContainer.firstChild); }
                            imgContainer.appendChild(errorText);
                        };
                        imgContainer.appendChild(img);
                        galleryContainer.appendChild(imgContainer);
                    });
                } else {
                    galleryContainer.innerHTML = '<p class="text-sm text-gray-500 text-center">No images available.</p>';
                }
            }

            // Populate Reviews (using shop.placeDetails if available from Google Places API)
            const reviewsContainer = document.getElementById('shopReviewsContainer');
            if (reviewsContainer) {
                if (shop.placeDetails && shop.placeDetails.reviews) { // Check if placeDetails and reviews exist
                    displayShopReviews(shop.placeDetails, reviewsContainer); // Pass placeDetails directly
                } else if (shop.Reviews && shop.Reviews.length > 0) { // Fallback to CSV reviews if any
                    console.warn("Using fallback CSV reviews for shop:", shop.Name);
                    displayShopReviews({ reviews: shop.Reviews }, reviewsContainer); // Adapt displayShopReviews or pass shop
                } else {
                    reviewsContainer.innerHTML = '<p class="text-sm text-gray-500 text-center">No reviews available yet.</p>';
                }
            }

            if (shopOverlayActuallyOpened && detailsOverlayShopElement) {
                // Reset directions buttons visibility
                document.getElementById('getShopDirectionsButton')?.classList.remove('hidden');
                document.getElementById('clearShopDirectionsButton')?.classList.add('hidden');
                const directionsPanelDiv = document.getElementById('directionsPanel');
                if (directionsPanelDiv) directionsPanelDiv.innerHTML = ""; // Clear old text directions
                // ... rest of right overlay population
            }


        } catch (e) {
            console.error("UILOGIC: Error populating RIGHT overlay:", e);
        }
    }


    // Populate Left Overlay (Social Media - Facebook, Twitter, Instagram Tabs)
    if (socialOverlayActuallyOpened && detailsOverlaySocialElement) {
        try {
            const fbPanel = document.getElementById('social-facebook');
            const twPanel = document.getElementById('social-twitter');
            const igPanel = document.getElementById('social-instagram');
            const fbContentContainer = document.getElementById('socialLinksContainer');
            const twContentContainer = document.getElementById('twitterTimelineContainer');
            const igContentContainer = document.getElementById('instagramFeedContainer');
            const allPanels = [fbPanel, twPanel, igPanel].filter(p => p);

            const tabButtons = detailsOverlaySocialElement.querySelectorAll('.css-target-tab-button');

            tabButtons.forEach(button => {
                button.onclick = (e) => {
                    const targetId = button.getAttribute('href').substring(1);
                    allPanels.forEach(panel => {
                        if (panel) panel.style.display = (panel.id === targetId) ? 'block' : 'none';
                    });
                    tabButtons.forEach(btn => {
                        btn.classList.toggle('active-social-tab-js', btn.getAttribute('href') === `#${targetId}`);
                    });

                    if (targetId === 'social-facebook' && shop.FacebookPageID && fbContentContainer) {
                        if (!fbContentContainer.querySelector('.fb-page')) {
                            const fbHTML = generateFacebookPagePluginHTML(shop.FacebookPageID, shop.Name || shop.FacebookPageID);
                            fbContentContainer.innerHTML = fbHTML;
                            if (typeof FB !== 'undefined' && FB.XFBML) setTimeout(() => FB.XFBML.parse(fbContentContainer), 50);
                        }
                    } else if (targetId === 'social-twitter' && shop.TwitterHandle && twContentContainer) {
                        displayTwitterTimeline(shop.TwitterHandle, twContentContainer);
                    } else if (targetId === 'social-instagram' && shop.InstagramUsername && igContentContainer) {
                        populateInstagramTab(shop, igContentContainer);
                    }
                    if(detailsOverlaySocialElement) detailsOverlaySocialElement.scrollTop = 0;
                };
            });

            let activePanelId = location.hash.substring(1);
            const validTabIds = ['social-facebook', 'social-twitter', 'social-instagram'];
            if (!validTabIds.includes(activePanelId)) activePanelId = 'social-facebook';

            allPanels.forEach(panel => {
                if (panel) panel.style.display = (panel.id === activePanelId) ? 'block' : 'none';
            });
            tabButtons.forEach(btn => {
                btn.classList.toggle('active-social-tab-js', btn.getAttribute('href') === `#${activePanelId}`);
            });

            if (activePanelId === 'social-facebook' && fbContentContainer && shop.FacebookPageID) {
                if (!fbContentContainer.querySelector('.fb-page')) {
                    const pagePluginHTML = generateFacebookPagePluginHTML(shop.FacebookPageID, shop.Name || shop.FacebookPageID);
                    fbContentContainer.innerHTML = pagePluginHTML;
                    if (typeof FB !== 'undefined' && FB.XFBML) setTimeout(() => { FB.XFBML.parse(fbContentContainer); }, 100);
                }
            } else if (fbContentContainer && !shop.FacebookPageID) {
                fbContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 fb-loading-placeholder">No Facebook Page configured.</p>';
            }

            if (activePanelId === 'social-twitter' && twContentContainer && shop.TwitterHandle) {
                displayTwitterTimeline(shop.TwitterHandle, twContentContainer);
            } else if (twContentContainer && activePanelId !== 'social-twitter') {
                twContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 tw-loading-placeholder">Click Twitter tab to load feed.</p>';
            } else if (twContentContainer && !shop.TwitterHandle) {
                 twContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 tw-loading-placeholder">No Twitter handle configured.</p>';
            }


            if (activePanelId === 'social-instagram' && igContentContainer && shop.InstagramUsername) {
                populateInstagramTab(shop, igContentContainer);
            } else if (igContentContainer && activePanelId !== 'social-instagram') {
                igContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 ig-loading-placeholder">Click Instagram tab to load.</p>';
            } else if (igContentContainer && !shop.InstagramUsername) {
                igContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 ig-loading-placeholder">No Instagram profile configured.</p>';
            }

            if(detailsOverlaySocialElement) detailsOverlaySocialElement.scrollTop = 0;

        } catch (e) {
            console.error("UILOGIC: Error populating LEFT social overlay:", e);
            // Basic error messages
            const fbC = document.getElementById('socialLinksContainer'); if(fbC) fbC.innerHTML = '<p class="text-sm text-red-500 p-4">Error loading Facebook.</p>';
            const twC = document.getElementById('twitterTimelineContainer'); if(twC) twC.innerHTML = '<p class="text-sm text-red-500 p-4">Error loading Twitter.</p>';
            const igC = document.getElementById('instagramFeedContainer'); if(igC) igC.innerHTML = '<p class="text-sm text-red-500 p-4">Error loading Instagram.</p>';
        }
    }

    if (shopOverlayActuallyOpened || socialOverlayActuallyOpened) {
        document.body.style.overflow = 'hidden';
    }
    // REMOVED map.panTo from here. It will be handled by showInfoWindowForShop or marker click logic.
    console.log("--- openClickedShopOverlays: END --- Overlays should be open and populated.");
}

function closeClickedShopOverlays() {
    console.log("--- closeClickedShopOverlays: START ---");
    let anOverlayWasOpen = false;

    if (detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open')) {
        closeOverlay(detailsOverlayShopElement); // Use the helper
        anOverlayWasOpen = true;
        console.log("Shop overlay closed.");
    }

    if (detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open')) {
        closeOverlay(detailsOverlaySocialElement); // Use the helper
        anOverlayWasOpen = true;
        console.log("Social overlay closed.");
    }

    if (anOverlayWasOpen) {
        if (typeof infowindow !== 'undefined' && infowindow && typeof infowindow.close === 'function') {
            console.log("Closing Google Maps infowindow as overlays are being closed.");
            infowindow.close();
        } else {
            // console.warn("Tried to close infowindow, but it's not defined or not a valid InfoWindow object.");
        }
    }

    document.body.style.overflow = '';
    console.log("--- closeClickedShopOverlays: END ---");
}

function sortShopsByDistanceGoogle(shops, mapCenter) {
    console.log("SORT_SHOPS: Called with mapCenter:", mapCenter ? mapCenter.toString() : "null");
    if (!google || !google.maps || !google.maps.geometry || !google.maps.geometry.spherical) {
        console.warn("SORT_SHOPS: Google Maps Geometry library not loaded. Returning original shops.");
        return shops.map(s => ({ ...s, distance: Infinity })); // Explicitly add Infinity
    }
    if (!mapCenter || !shops || shops.length === 0) {
         console.warn("SORT_SHOPS: No mapCenter or no shops. Returning original shops.");
        return shops.map(s => ({ ...s, distance: Infinity })); // Explicitly add Infinity
    }

    return shops.map(shop => {
        if (shop.lat !== undefined && shop.lng !== undefined) {
            const shopLocation = new google.maps.LatLng(shop.lat, shop.lng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLocation);
            // console.log(`SORT_SHOPS: Shop: ${shop.Name}, Lat: ${shop.lat}, Lng: ${shop.lng}, Calculated Distance (m): ${distance}`);
            return { ...shop, distance: distance }; // distance is in meters
        }
        // console.log(`SORT_SHOPS: Shop: ${shop.Name} - No lat/lng. Distance set to Infinity.`);
        return { ...shop, distance: Infinity };
    }).sort((a, b) => a.distance - b.distance);
}














// js/uiLogic.js

function renderListings(shopsToRender, performSort = true, sortCenter = null) {
    // ... (beginning of your function: checks for listingsPanelElement, listingsContainer, sorting logic) ...
    // Ensure listingsPanelElement, listingsContainer, noResultsDiv are defined globally or passed
    if (!listingsPanelElement) { console.error("Listings panel element not found."); return; }
    if (!listingsContainer) { console.error("Listings container element not found."); return; }
    // ...
    let shopsForDisplay = [...shopsToRender];



    // Inside renderListings, before the sort:
console.log("RENDER_LISTINGS: performSort:", performSort, "map available:", !!(typeof map !== 'undefined' && map && map.getCenter()));
const centerForSort = sortCenter || (map ? map.getCenter() : null);
console.log("RENDER_LISTINGS: centerForSort:", centerForSort);

if (performSort && centerForSort) {
    console.log("RENDER_LISTINGS: Attempting to sort by distance.");
    shopsForDisplay = sortShopsByDistanceGoogle(shopsForDisplay, centerForSort);
} else {
    console.log("RENDER_LISTINGS: SKIPPING sort by distance.");
}



    if (performSort && typeof map !== 'undefined' && map && map.getCenter()) { // Ensure map is available and has a center
        const centerForSort = sortCenter || map.getCenter();
        if (centerForSort) {
            // console.log("Sorting listings by distance from:", centerForSort.lat(), centerForSort.lng());
            shopsForDisplay = sortShopsByDistanceGoogle(shopsForDisplay, centerForSort);
        }
    }
    // Assuming currentlyDisplayedShops is global or accessible
    if (typeof currentlyDisplayedShops !== 'undefined') {
        currentlyDisplayedShops = shopsForDisplay;
    }

    
    listingsContainer.innerHTML = '';

    if (shopsForDisplay.length > 0) {
        if (noResultsDiv) noResultsDiv.classList.add('hidden');
        listingsContainer.classList.remove('hidden');

        shopsForDisplay.forEach(shop => {
            const card = document.createElement('div');
            // Base classes remain
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer';
            // Add flex item sizing and padding
            card.classList.add('w-full', 'px-1', 'sm:px-2', 'mb-2', 'sm:mb-4'); // mb for vertical spacing
            const shopIdentifier = shop.GoogleProfileID || shop.Name;
            card.setAttribute('data-shop-id', shopIdentifier);


 // --- MODIFIED IMAGE URL LOGIC ---
            let actualImageUrl;
            const placeholderImageName = encodeURIComponent(shop.Name.split(' ')[0] + ' ' + (shop.Name.split(' ')[1] || 'Farm Stand')); // More descriptive placeholder
            const fallbackImageUrl = `https://placehold.co/400x250/E0E0E0/757575?text=${placeholderImageName}&font=inter`;

            // Check if shop.ImageOne (from CSV's image_one column) is valid
            if (shop.ImageOne && typeof shop.ImageOne === 'string' && shop.ImageOne.trim() !== '') {
                // Assuming shop.ImageOne contains the filename, e.g., "my_image.jpg"
                // And your images are in the /images/ folder relative to index.html
                actualImageUrl = `images/${shop.ImageOne.trim()}`;
            } else {
                // Fallback if shop.ImageOne is missing, empty, or not a string
                actualImageUrl = fallbackImageUrl;
            }
            // --- END OF MODIFIED IMAGE URL LOGIC ---



            
            
            
          let contactInfoHTML = '';
            const ratingContainerIdForThisCard = `rating-for-${shop.GoogleProfileID || shop.Name.replace(/\s+/g, '-')}`;

    
            let initialStarsHTML = getStarRatingHTML(NaN); 
            if (shop.placeDetails && typeof shop.placeDetails.rating === 'number') {
                initialStarsHTML = getStarRatingHTML(shop.placeDetails.rating, shop.placeDetails.user_ratings_total);
            }

            // Phone Link
            if (shop.Phone) {
                contactInfoHTML += `
                    <div class="w-full mb-1"> <!-- Each link on its own row, mb-1 for space if both exist -->
                        <a href="tel:${shop.Phone}" 
                           onclick="event.stopPropagation();" 
                           class="text-blue-600 hover:text-blue-800 hover:underline text-sm">
                           Call: ${shop.Phone}
                        </a>
                    </div>`;
            }

            // Website Link
            if (shop.Website && !shop.Website.includes('googleusercontent.com')) {
                // Sanitize URL display slightly for very long URLs if needed, but target keeps full URL
                let displayWebsite = shop.Website;
                try {
                    const urlObj = new URL(shop.Website);
                    displayWebsite = urlqObj.hostname.replace(/^www\./, '') + (urlObj.pathname.length > 1 ? "/..." : urlObj.pathname);
                    if (displayWebsite.length > 30) displayWebsite = displayWebsite.substring(0, 27) + "...";
                } catch (e) { /* ignore if invalid URL, use original */ }

                contactInfoHTML += `
                    <div class="w-full">
                        <a href="${shop.Website}" 
                           target="_blank" rel="noopener noreferrer" 
                           onclick="event.stopPropagation();" 
                           class="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all">
                                ${displayWebsite}
                        </a>
                    </div>`;
            }



            if (shop.GoogleProfileID || (shop.lat && shop.lng)) { // Check if we have a destination
                 contactInfoHTML += `
                    <div class="w-full mt-2">
                        <button data-shopid="${shop.GoogleProfileID || shop.Name}" class="listing-get-directions-button inline-flex items-center justify-center w-full px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                           <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                           Directions
                        </button>
                    </div>`;
            }




            
            let distanceText = '';
            if (shop.distance !== undefined && shop.distance !== Infinity) {
                const distKm = (shop.distance / 1000).toFixed(1);
                distanceText = `<p class="text-xs text-blue-500 mt-1">~${distKm} km away</p>`;
            }



            card.innerHTML = `
                <img class="w-full h-40 sm:h-48 object-cover" 
                     src="${actualImageUrl}" 
                     alt="Image of ${shop.Name}" 
                     onerror="this.onerror=null; this.src='${fallbackImageUrl}'; console.error('IMAGE LOAD ERROR for ${shop.Name}');">
                <div class="p-3 sm:p-4">
                    <div class="flex justify-between items-start mb-1">
                        <h2 class="text-lg sm:text-xl font-semibold text-gray-800 leading-tight truncate" title="${shop.Name}">${shop.Name}</h2>
                        <div id="${ratingContainerIdForThisCard}" class="shop-card-rating">
                            ${initialStarsHTML}
                        </div>
                    </div>
                    <p class="text-xs sm:text-sm text-gray-500 mb-0 truncate" title="${shop.Address}">
                        <svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                        ${shop.Address || 'Address not available'}
                    </p>
                    ${distanceText}
                    <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                        ${contactInfoHTML || '<p class="text-xs text-gray-400">No contact information available.</p>'}
                    </div>
                </div>;
            `;
            listingsContainer.appendChild(card);






            const directionsButtonOnCard = card.querySelector('.listing-get-directions-button');
            if (directionsButtonOnCard) {
                directionsButtonOnCard.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent card click if button is distinct
                    console.log("UILOGIC: Directions button on card clicked for shop:", shop.Name);
                    // Ensure overlays are open for this shop
                    if (typeof openClickedShopOverlays === 'function') {
                        openClickedShopOverlays(shop); // This populates overlays
                    }
                    // Trigger directions. Pass the shop object or its destination.
                    // The 'Get Directions' button IN THE OVERLAY will be the main trigger after this.
                    // For now, clicking this button ensures the overlay for THIS shop is open.
                    // The user will then click the "Get Directions" button in the overlay.
                    // OR: we can directly trigger directions from here. Let's do that for better UX.
                    setTimeout(() => { // Delay to ensure overlay is ready
                        handleGetDirections(shop); // New function we'll define
                    }, 150); // Adjust delay
                });
            }










            // ASYNCHRONOUSLY FETCH AND UPDATE RATING IF NEEDED
            if (!shop.placeDetails && shop.GoogleProfileID && typeof placesService !== 'undefined') {
                if (!shop._isFetchingDetails) {
                    shop._isFetchingDetails = true;
                    placesService.getDetails({
                        placeId: shop.GoogleProfileID,
                        fields: ['rating', 'user_ratings_total']
                    }, (place, status) => { // This is a new function scope (callback)
                        shop._isFetchingDetails = false; 
                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                            shop.placeDetails = { 
                                ...shop.placeDetails,
                                rating: place.rating,
                                user_ratings_total: place.user_ratings_total
                            };
                            
                            // --- SOLUTION: Reconstruct or ensure ratingContainerIdForThisCard is accessible ---
                            // Since 'shop' is accessible here due to closure, we can reconstruct the ID
                            const idToUpdate = `rating-for-${shop.GoogleProfileID || shop.Name.replace(/\s+/g, '-')}`;
                            // OR, simply use the ratingContainerIdForThisCard which is also captured by the closure
                            // const idToUpdate = ratingContainerIdForThisCard;

                            const ratingDiv = document.getElementById(idToUpdate); // Use the reconstructed or captured ID
                            if (ratingDiv) {
                                ratingDiv.innerHTML = getStarRatingHTML(place.rating, place.user_ratings_total);
                            }
                        } 
                    });
                }
            }







                


            // --- THIS IS THE REVISED CLICK LISTENER ---
            card.addEventListener('click', () => {
                console.log(`UILOGIC: Listing card clicked for shop ID: ${shopIdentifier}, Name: ${shop.Name}`);

                // 1. Open overlays (this will populate them too)
                if (typeof openClickedShopOverlays === 'function') {
                    openClickedShopOverlays(shop); // Pass the full shop object
                } else {
                    console.warn("UILOGIC: openClickedShopOverlays function is not defined.");
                }

                // 2. Show InfoWindow (this will pan the map *after* overlays are open)
                // Use a slight delay to ensure DOM has updated from overlay opening and CSS transitions.
                setTimeout(() => {
                    console.log(`UILOGIC: Delayed action for listing click - showing infowindow for ${shop.Name}`);
                    if (shop.GoogleProfileID) {
                        if (typeof showInfoWindowForShop === 'function') {
                            showInfoWindowForShop(shop.GoogleProfileID); // This function in mapLogic.js will handle panning
                        } else {
                            console.error("UILOGIC: showInfoWindowForShop function is not defined.");
                        }
                    } else {
                        console.warn(`UILOGIC: Cannot show InfoWindow for "${shop.Name}" as it's missing a GoogleProfileID.`);
                        if (shop.lat && shop.lng && typeof map !== 'undefined' && map && typeof getAdjustedMapCenter === 'function') {
                            console.log("UILOGIC: Listing click - Panning to lat/lng due to no GoogleProfileID.");
                            map.panTo(getAdjustedMapCenter({ lat: shop.lat, lng: shop.lng }));
                        }
                    }
                }, 100); // 100ms delay. Adjust if transitions are longer or if offset is still off.

                // Optional: Highlight this card in the list
                document.querySelectorAll('#listingsContainer .bg-white.rounded-xl').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'));
                card.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            });
            // --- END OF REVISED CLICK LISTENER ---

            listingsContainer.appendChild(card);
        });
    } else {
        // ... (no results logic) ...
        if (noResultsDiv) {
            noResultsDiv.textContent = (typeof GOOGLE_SHEET_DIRECT_URL !== 'undefined' && GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER) ? '' : 'No farm stands found matching your search or current view.';
            noResultsDiv.classList.toggle('hidden', (typeof GOOGLE_SHEET_DIRECT_URL !== 'undefined' && GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER) && document.readyState !== "complete");
        }
        listingsContainer.classList.add('hidden');
    }
}































// You'll also need the populateInstagramTab function in uiLogic.js if it's not already there:
function populateInstagramTab(shop, instagramFeedContainerElement) {
    if (!instagramFeedContainerElement) { console.error("Instagram container not found in populateInstagramTab"); return; }

    if (shop.InstagramUsername) { // Assuming this comes from your CSV as shop.Instagram (as per apiService.js)
        const username = shop.InstagramUsername.replace('@', ''); // Use shop.Instagram or shop.InstagramUsername
        instagramFeedContainerElement.innerHTML = ''; 
        if (shop.InstagramRecentPostEmbedCode) { // Assuming this field exists if you store embed codes
            const embedWrapper = document.createElement('div');
            embedWrapper.className = 'instagram-embed-wrapper';
            embedWrapper.innerHTML = shop.InstagramRecentPostEmbedCode;
            instagramFeedContainerElement.appendChild(embedWrapper);
            if (window.instgrm && window.instgrm.Embeds) {
                window.instgrm.Embeds.process();
            }
            const profileLinkBelowEmbed = document.createElement('a');
            profileLinkBelowEmbed.href = `https://www.instagram.com/${username}/`;
            profileLinkBelowEmbed.target = "_blank";
            profileLinkBelowEmbed.rel = "noopener noreferrer";
            profileLinkBelowEmbed.className = "block text-center mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm";
            profileLinkBelowEmbed.innerHTML = `View all posts @${username}`;
            instagramFeedContainerElement.appendChild(profileLinkBelowEmbed);
        } else {
            const profileLinkOnly = document.createElement('a');
            profileLinkOnly.href = `https://www.instagram.com/${username}/`;
            profileLinkOnly.target = "_blank";
            profileLinkOnly.rel = "noopener noreferrer";
            profileLinkOnly.className = "inline-block px-6 py-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-150 ease-in-out";
            profileLinkOnly.innerHTML = `<svg class="inline-block w-5 h-5 mr-2 -mt-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997-1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747-.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068-1.18.053-1.847.28-2.377.48-.575.222-1.018.567-1.465 1.015-.447.447-.793.89-1.015 1.464-.2.53-.427 1.197-.48 2.378C2.024 8.556 2.012 8.925 2.012 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377.222.575.567 1.018 1.015 1.465.447.447.89.793 1.464 1.015.53.2 1.197.427 2.378.48 1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847.28 2.377-.48.575-.222 1.018.567 1.465 1.015.447.447.793.89 1.015 1.464-.2-.53.427-1.197-.48-2.378.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377-.222-.575-.567-1.018-1.015-1.465-.447-.447-.793-.89-1.015-1.464-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg> View @${username} on Instagram`; // Ensure SVG path is complete
            instagramFeedContainerElement.appendChild(profileLinkOnly);
        }
    } else {
        instagramFeedContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Instagram profile configured.</p>';
    }
}
// ... (rest of uiLogic.js)

















// NEW function in uiLogic.js to handle the directions request
function handleGetDirections(shop) {
    if (!shop) {
        alert("Shop data not available for directions.");
        return;
    }
    console.log("UILOGIC: handleGetDirections called for shop:", shop.Name);
    currentShopForDirections = shop; // Store it in case overlay button is used

    let destination;
    if (shop.lat && shop.lng) {
        destination = { lat: shop.lat, lng: shop.lng };
    } else if (shop.GoogleProfileID) {
        // If only Place ID, DirectionsService can use it if you specify placeId: shop.GoogleProfileID
        // Or, you'd need to ensure lat/lng are fetched first via getDetails
        destination = { placeId: shop.GoogleProfileID };
        console.warn("Using Place ID for directions destination. Lat/Lng preferred for calculateAndDisplayRoute.");
        // For calculateAndDisplayRoute, it might be better to ensure lat/lng is available.
        // If shop.placeDetails exists from an infowindow load, use its geometry.
        if (shop.placeDetails && shop.placeDetails.geometry && shop.placeDetails.geometry.location) {
            destination = {
                lat: shop.placeDetails.geometry.location.lat(),
                lng: shop.placeDetails.geometry.location.lng()
            };
        } else if (shop.Address) {
            destination = shop.Address; // Fallback to address string
        } else {
            alert("Cannot determine destination for directions for " + shop.Name);
            return;
        }
    } else if (shop.Address) {
        destination = shop.Address;
    } else {
        alert("Not enough information to get directions for " + shop.Name);
        return;
    }

    if (typeof calculateAndDisplayRoute === 'function') { // calculateAndDisplayRoute is in mapLogic.js
        // Ensure overlays don't obscure the map too much if user wants to see directions
        // Optionally, you could choose to close the social overlay here:
        // if (detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open')) {
        //     closeOverlay(detailsOverlaySocialElement);
        // }
        calculateAndDisplayRoute(destination);
    } else {
        console.error("calculateAndDisplayRoute function not found in mapLogic.js");
    }
}