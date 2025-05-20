// js/uiLogic.js
document.addEventListener('DOMContentLoaded', () => {
    window.detailsOverlayShopElement = document.getElementById('detailsOverlayShop');
    window.detailsOverlaySocialElement = document.getElementById('detailsOverlaySocial');
    // Add other elements as needed, e.g.:
    window.shopDetailNameElement = document.getElementById('shopDetailName');
    // window.shopDetailRatingStarsElement = document.getElementById('shopDetailRatingStars'); // Not directly used, part of card/overlay content
    // window.shopDetailAddressElement = document.getElementById('shopDetailAddress'); // Not directly used
    // window.shopDetailPhoneElement = document.getElementById('shopDetailPhone'); // Not directly used
    // window.shopDetailWebsiteElement = document.getElementById('shopDetailWebsite'); // Not directly used
    // window.shopDetailMapLinkContainerElement = document.getElementById('shopDetailMapLinkContainer'); // Not directly used
    // window.shopDetailDistanceElement = document.getElementById('shopDetailDistance'); // Not directly used
    window.socialLinksContainerElement = document.getElementById('socialLinksContainer');
    window.twitterTimelineContainerElement = document.getElementById('twitterTimelineContainer');

    const getDirectionsBtnOverlay = document.getElementById('getShopDirectionsButton');
    if (getDirectionsBtnOverlay) {
        getDirectionsBtnOverlay.addEventListener('click', () => {
            // currentShopForDirections is set in main.js or when openClickedShopOverlays is called
            if (currentShopForDirections) {
                handleGetDirections(currentShopForDirections);
            } else {
                console.error("No shop selected to get directions for from overlay button.");
                alert("Please select a shop first, or ensure the overlay is correctly populated.");
            }
        });
    }

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
    // console.log("Overlay opened:", overlay.id);
}
function closeOverlay(overlay) {
    if (!overlay) return; // Guard clause
    overlay.classList.remove('is-open');
    overlay.classList.add('hidden');
    // console.log("Overlay closed:", overlay.id);
}

function getStarRatingHTML(ratingStringOrNumber, reviewCount) {
    const rating = parseFloat(ratingStringOrNumber);

    if (ratingStringOrNumber === "N/A" || isNaN(rating) || rating < 0 || rating > 5) {
        return `<span class="text-sm text-gray-400">No rating</span>`;
    }

    const rounded = Math.round(rating * 2) / 2; // Round to nearest 0.5
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rounded) {
            stars += '★'; // full star
        } else if (i - 0.5 === rounded) {
            stars += '½'; // half star - you might need a specific half-star icon or character
                           // For simplicity, let's use '☆' for not full, or adjust logic for actual half star icons
            stars += '☆'; // Placeholder if no half star char, effectively rounding down visually for halves
        } else {
            stars += '☆'; // empty star
        }
    }
    // More accurate half star display if you have a suitable character or SVG
    stars = ''; // Rebuild for better half-star logic
    for (let i = 0; i < 5; i++) {
        if (rating >= i + 1) {
            stars += '★'; // Full star
        } else if (rating >= i + 0.5) {
            stars += '⭐'; // Using a different star for half, or use an SVG/font icon for half-star
                          // This might look like a full star. A true half-star visual is better.
                          // For simplicity, let's go back to rounding to nearest full star for display
            stars += '★'; // Treat > .5 as full for this simple display
        } else {
            stars += '☆'; // Empty star
        }
    }
    // Simpler: round to nearest full star for visual
    stars = '';
    const visuallyRounded = Math.round(rating);
    for (let i = 0; i < 5; i++) stars += i < visuallyRounded ? '★' : '☆';


    const displayRatingValue = rating.toFixed(1);
    let reviewCountText = '';
    if (typeof reviewCount === 'number' && reviewCount > 0) {
        reviewCountText = ` <span class="text-gray-500 text-xs ml-1">(${displayRatingValue} from ${reviewCount} reviews)</span>`;
    } else if (reviewCount === 0) {
         reviewCountText = ` <span class="text-gray-500 text-xs ml-1">(${displayRatingValue}, no reviews)</span>`;
    } else {
         reviewCountText = ` <span class="text-gray-500 text-xs ml-1">(${displayRatingValue})</span>`;
    }

    return `<span class="text-yellow-400 text-lg">${stars}</span>${reviewCountText}`;
}

function generateFacebookPagePluginHTML(pageId, pageName) {
    if (!pageId) {
        console.error("Cannot generate Page Plugin: Page ID is missing.");
        return '<!-- Error: Facebook Page ID is missing. -->';
    }

    const facebookPageLink = `https://www.facebook.com/${pageId}/`;
    const displayName = pageName || pageId;

    const pluginHTML = `
<div class="fb-page"
     data-href="${facebookPageLink}"
     data-tabs="timeline"
     data-width="" 
     data-height="500" 
     data-small-header="true"
     data-adapt-container-width="true"
     data-hide-cover="true"
     data-show-facepile="false">
    <blockquote cite="${facebookPageLink}" class="fb-xfbml-parse-ignore">
        <a href="${facebookPageLink}">${displayName}</a>
    </blockquote>
</div>`;
    return pluginHTML;
}


function displayTwitterTimeline(twitterHandle, containerElement) {
    if (!containerElement) {
        // console.error("TWITTER DEBUG: Twitter container element not found.");
        return;
    }

    containerElement.innerHTML = ''; // Clear previous content

    if (!twitterHandle || typeof twitterHandle !== 'string' || twitterHandle.trim() === '') {
        // console.log("TWITTER DEBUG: No valid Twitter handle provided.", twitterHandle);
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Twitter handle configured for this shop.</p>';
        return;
    }

    const cleanHandle = twitterHandle.replace('@', '').trim();
    if (!cleanHandle) {
        // console.log("TWITTER DEBUG: Cleaned Twitter handle is empty.", twitterHandle);
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">Invalid Twitter handle configured.</p>';
        return;
    }

    // console.log(`TWITTER DEBUG: Attempting to embed timeline for: @${cleanHandle}`);
    containerElement.innerHTML = `<p class="text-sm text-gray-400 p-4">Loading Twitter feed for @${cleanHandle}...</p>`; 

    if (typeof twttr === 'undefined' || !twttr.widgets || typeof twttr.widgets.createTimeline !== 'function') {
        console.error("TWITTER DEBUG: Twitter widgets script (twttr.widgets or createTimeline) not ready or loaded.");
        containerElement.innerHTML = '<p class="text-sm text-red-500 p-4">Twitter embedding script not available. Please ensure it has loaded.</p>';
        return;
    }

    // console.log("TWITTER DEBUG: 'twttr' object seems valid. Calling createTimeline.");

    try {
        const promise = twttr.widgets.createTimeline(
            {
                sourceType: 'profile',
                screenName: cleanHandle
            },
            containerElement,
            {
                height: '450', // Adjust height as needed
                theme: 'light',
                chrome: 'noheader nofooter noborders noscrollbar transparent',
                tweetLimit: 5 // Show recent 5 tweets
            }
        );

        // console.log("TWITTER DEBUG: createTimeline call MADE. Promise object:", promise);

        if (!promise || typeof promise.then !== 'function') {
            console.error("TWITTER DEBUG: createTimeline did not return a valid promise!");
            containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Twitter widget creation failed to start properly.</p>`;
            return;
        }

        promise.then(function (el) {
            // console.log("TWITTER DEBUG: createTimeline.then callback received. Element:", el);
            if (el) {
                // console.log("TWITTER DEBUG: Twitter timeline embedded for @" + cleanHandle);
                // Check if the container only has the loading paragraph or is empty.
                if (containerElement.childNodes.length === 0 || 
                    (containerElement.childNodes.length === 1 && containerElement.firstChild.tagName === 'P' && containerElement.firstChild.textContent.startsWith("Loading Twitter feed"))) {
                     containerElement.innerHTML = `<p class="text-sm text-orange-500 p-4">Timeline for @${cleanHandle} loaded, but might be empty. Check the Twitter account's privacy settings or if it has recent public tweets.</p>`;
                }
            } else {
                console.warn("TWITTER DEBUG: Twitter timeline could not be embedded for @" + cleanHandle + ". 'el' is falsy. The account may be private, suspended, or the handle incorrect.");
                containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Could not embed Twitter timeline for @${cleanHandle}. The account might be private, suspended, have no recent tweets, or the handle is incorrect.</p>`;
            }
        }).catch(function (e) {
            console.error("TWITTER DEBUG: Error creating Twitter timeline for @" + cleanHandle + ":", e);
            containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">An error occurred while embedding the Twitter timeline for @${cleanHandle}. See console for details.</p>`;
        });
    } catch (error) {
        console.error("TWITTER DEBUG: Synchronous error calling twttr.widgets.createTimeline:", error);
        containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Failed to initiate Twitter timeline embedding. Twitter script might be missing or broken.</p>`;
    }
}


async function openClickedShopOverlays(shop) {
    // console.log("UILOGIC: openClickedShopOverlays initiated for shop:", shop ? shop.Name : "No shop data");
    if (!shop) {
        console.error("Critical Error: Shop data is null in openClickedShopOverlays. Cannot open overlays.");
        return;
    }
    currentShopForDirections = shop; // Set for the "Get Directions" button in the overlay

    let shopOverlayActuallyOpened = false;
    let socialOverlayActuallyOpened = false;

    if (detailsOverlayShopElement) {
        openOverlay(detailsOverlayShopElement);
        detailsOverlayShopElement.scrollTop = 0;
        shopOverlayActuallyOpened = true;
        // console.log("UILOGIC: detailsOverlayShopElement instructed to open.");
    } else {
        console.error("UILOGIC: detailsOverlayShopElement not found!");
    }

    if (detailsOverlaySocialElement) {
        openOverlay(detailsOverlaySocialElement);
        detailsOverlaySocialElement.scrollTop = 0;
        socialOverlayActuallyOpened = true;
        // console.log("UILOGIC: detailsOverlaySocialElement instructed to open.");
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
                galleryContainer.innerHTML = ''; // Clear previous images
                const imageFilenames = [];
                if (shop.ImageOne) imageFilenames.push(shop.ImageOne);
                if (shop.ImageTwo) imageFilenames.push(shop.ImageTwo);
                if (shop.ImageThree) imageFilenames.push(shop.ImageThree);

                if (imageFilenames.length > 0) {
                    imageFilenames.forEach(filename => {
                        if (!filename || !filename.trim()) return;
                        const trimmedFilename = filename.trim();
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'gallery-image-container'; // Ensure this class has styling (e.g., width, height, overflow)
                        const img = document.createElement('img');
                        img.src = `images/${trimmedFilename}`;
                        img.alt = `${shop.Name || 'Shop'} image - ${trimmedFilename}`;
                        img.className = 'gallery-image'; // Ensure this class has styling (e.g., w-full, h-auto or object-cover)
                        img.onerror = function() {
                            this.style.display = 'none'; // Hide broken image
                            // Optionally, show a placeholder or error message in its place
                            const errorText = document.createElement('p');
                            errorText.textContent = 'Image not found';
                            errorText.className = 'text-xs text-gray-500 text-center p-2';
                            // imgContainer.appendChild(errorText); // Append to specific container
                            this.parentElement.innerHTML = '<p class="text-xs text-gray-500 text-center p-2">Image not found</p>';
                        };
                        imgContainer.appendChild(img);
                        galleryContainer.appendChild(imgContainer);
                    });
                } else {
                    galleryContainer.innerHTML = '<p class="text-sm text-gray-500 text-center p-4">No images available for this shop.</p>';
                }
            }

            // Populate Reviews (if a container exists)
            // This assumes displayShopReviews exists and knows how to handle shop.placeDetails or CSV reviews
            const reviewsContainer = document.getElementById('shopReviewsContainer'); // Make sure this ID exists in your HTML
            if (reviewsContainer) {
                if (shop.placeDetails && shop.placeDetails.reviews && shop.placeDetails.reviews.length > 0) {
                    if (typeof displayShopReviews === "function") displayShopReviews(shop.placeDetails, reviewsContainer);
                    else reviewsContainer.innerHTML = '<p class="text-sm text-gray-500 p-4">Review display function missing.</p>';
                } else if (shop.Reviews && shop.Reviews.length > 0) { // Fallback to CSV reviews
                    if (typeof displayShopReviews === "function") displayShopReviews({ reviews: shop.Reviews }, reviewsContainer); // Adapt if needed
                    else reviewsContainer.innerHTML = '<p class="text-sm text-gray-500 p-4">Review display function missing.</p>';
                } else {
                    reviewsContainer.innerHTML = '<p class="text-sm text-gray-500 text-center p-4">No reviews available yet.</p>';
                }
            }

            // Reset directions buttons visibility and clear old textual directions
            document.getElementById('getShopDirectionsButton')?.classList.remove('hidden');
            document.getElementById('clearShopDirectionsButton')?.classList.add('hidden');
            const directionsPanelDiv = document.getElementById('directionsPanel');
            if (directionsPanelDiv) directionsPanelDiv.innerHTML = "";

        } catch (e) {
            console.error("UILOGIC: Error populating RIGHT overlay:", e);
            if (shopDetailNameElement) shopDetailNameElement.textContent = 'Error loading details';
        }
    }


    // Populate Left Overlay (Social Media - Facebook, Twitter, Instagram Tabs)
    if (socialOverlayActuallyOpened && detailsOverlaySocialElement) {
        try {
            // Tab targets (content panels)
            const fbPanel = document.getElementById('social-facebook'); // Assuming your HTML structure for tabs
            const twPanel = document.getElementById('social-twitter');
            const igPanel = document.getElementById('social-instagram');
            
            // Content containers within those panels
            const fbContentContainer = document.getElementById('socialLinksContainer');
            const twContentContainer = document.getElementById('twitterTimelineContainer');
            const igContentContainer = document.getElementById('instagramFeedContainer');

            // If using a tabbed interface where only one panel is visible at a time:
            // This logic assumes you have tab buttons that link to these panel IDs (e.g. <a href="#social-facebook">)
            // and CSS that hides/shows panels based on a class or :target selector.
            // For JS-controlled tabs:
            const allPanels = [fbPanel, twPanel, igPanel].filter(p => p); // Filter out nulls if some don't exist
            const tabButtons = detailsOverlaySocialElement.querySelectorAll('.css-target-tab-button'); // Adjust selector for your tab buttons

            // Default to Facebook tab or first available
            let activeTabId = 'social-facebook'; // Default
            if (!shop.FacebookPageID && shop.TwitterHandle) activeTabId = 'social-twitter';
            else if (!shop.FacebookPageID && !shop.TwitterHandle && shop.InstagramUsername) activeTabId = 'social-instagram';

            // Function to show a specific tab
            const showTab = (tabId) => {
                allPanels.forEach(panel => {
                    if (panel) panel.style.display = (panel.id === tabId) ? 'block' : 'none';
                });
                tabButtons.forEach(btn => {
                    btn.classList.toggle('active-social-tab-js', btn.getAttribute('href') === `#${tabId}`);
                });

                // Load content for the activated tab
                if (tabId === 'social-facebook' && fbContentContainer) {
                    if (shop.FacebookPageID) {
                        // Only reload if not already loaded or different shop
                        if (!fbContentContainer.querySelector('.fb-page') || fbContentContainer.dataset.currentPageId !== shop.FacebookPageID) {
                            const fbHTML = generateFacebookPagePluginHTML(shop.FacebookPageID, shop.Name);
                            fbContentContainer.innerHTML = fbHTML;
                            fbContentContainer.dataset.currentPageId = shop.FacebookPageID;
                            if (typeof FB !== 'undefined' && FB.XFBML) setTimeout(() => FB.XFBML.parse(fbContentContainer), 50);
                        }
                    } else {
                        fbContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4">No Facebook Page configured for this shop.</p>';
                    }
                } else if (tabId === 'social-twitter' && twContentContainer) {
                    if (shop.TwitterHandle) {
                        // Only reload if not already loaded or different handle
                        if (twContentContainer.dataset.currentTwitterHandle !== shop.TwitterHandle) {
                            displayTwitterTimeline(shop.TwitterHandle, twContentContainer);
                            twContentContainer.dataset.currentTwitterHandle = shop.TwitterHandle;
                        }
                    } else {
                        twContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4">No Twitter handle configured for this shop.</p>';
                    }
                } else if (tabId === 'social-instagram' && igContentContainer) {
                     if (shop.InstagramUsername) { // Corrected from shop.Instagram
                        // Only reload if not already loaded or different username
                        if (igContentContainer.dataset.currentInstaUser !== shop.InstagramUsername) {
                           populateInstagramTab(shop, igContentContainer); // populateInstagramTab expects shop object
                           igContentContainer.dataset.currentInstaUser = shop.InstagramUsername;
                        }
                    } else {
                        igContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4">No Instagram profile configured for this shop.</p>';
                    }
                }
                if(detailsOverlaySocialElement) detailsOverlaySocialElement.scrollTop = 0; // Scroll tab content to top
            };

            tabButtons.forEach(button => {
                button.onclick = (e) => {
                    e.preventDefault(); // Prevent hash change if using href for panel IDs
                    const targetId = button.getAttribute('href').substring(1);
                    showTab(targetId);
                };
            });

            // Show the initial active tab
            showTab(activeTabId);

        } catch (e) {
            console.error("UILOGIC: Error populating LEFT social overlay:", e);
            const fbC = document.getElementById('socialLinksContainer'); if(fbC) fbC.innerHTML = '<p class="text-sm text-red-500 p-4">Error loading Facebook content.</p>';
            const twC = document.getElementById('twitterTimelineContainer'); if(twC) twC.innerHTML = '<p class="text-sm text-red-500 p-4">Error loading Twitter content.</p>';
            const igC = document.getElementById('instagramFeedContainer'); if(igC) igC.innerHTML = '<p class="text-sm text-red-500 p-4">Error loading Instagram content.</p>';
        }
    }

    if (shopOverlayActuallyOpened || socialOverlayActuallyOpened) {
        document.body.style.overflow = 'hidden'; // Prevent body scroll when overlays are open
    }
    // console.log("--- openClickedShopOverlays: END --- Overlays should be open and populated.");
}

function closeClickedShopOverlays() {
    // console.log("--- closeClickedShopOverlays: START ---");
    let anOverlayWasOpen = false;

    if (detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open')) {
        closeOverlay(detailsOverlayShopElement);
        anOverlayWasOpen = true;
        // console.log("Shop overlay closed.");
    }

    if (detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open')) {
        closeOverlay(detailsOverlaySocialElement);
        anOverlayWasOpen = true;
        // console.log("Social overlay closed.");
    }

    if (anOverlayWasOpen) {
        if (typeof infowindow !== 'undefined' && infowindow && typeof infowindow.close === 'function') {
            // console.log("Closing Google Maps infowindow as overlays are being closed.");
            infowindow.close();
        }
        document.body.style.overflow = ''; // Restore body scroll
        currentShopForDirections = null; // Clear the shop context for overlay directions
    }
    // console.log("--- closeClickedShopOverlays: END ---");
}


function sortShopsByDistanceGoogle(shops, mapCenter) {
    // console.log("SORT_SHOPS: Called with mapCenter:", mapCenter ? mapCenter.toString() : "null");
    if (!google || !google.maps || !google.maps.geometry || !google.maps.geometry.spherical) {
        // console.warn("SORT_SHOPS: Google Maps Geometry library not loaded. Returning original shops.");
        return shops.map(s => ({ ...s, distance: Infinity }));
    }
    if (!mapCenter || !shops || shops.length === 0) {
        //  console.warn("SORT_SHOPS: No mapCenter or no shops. Returning original shops.");
        return shops.map(s => ({ ...s, distance: Infinity }));
    }

    return shops.map(shop => {
        // Ensure shop.lat and shop.lng are valid numbers
        const shopLat = parseFloat(shop.lat);
        const shopLng = parseFloat(shop.lng);

        if (!isNaN(shopLat) && !isNaN(shopLng)) {
            const shopLocation = new google.maps.LatLng(shopLat, shopLng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLocation);
            return { ...shop, distance: distance }; // distance in meters
        }
        return { ...shop, distance: Infinity }; // No lat/lng or invalid
    }).sort((a, b) => a.distance - b.distance);
}


function renderListings(shopsToRender, performSort = true, sortCenter = null) {
    if (!listingsPanelElement) { console.error("Listings panel element not found."); return; }
    if (!listingsContainer) { console.error("Listings container element not found."); return; }
    
    let shopsForDisplay = [...shopsToRender];

    const centerForSort = sortCenter || (typeof map !== 'undefined' && map ? map.getCenter() : null);

    if (performSort && centerForSort) {
        // console.log("RENDER_LISTINGS: Attempting to sort by distance to:", centerForSort.toString());
        shopsForDisplay = sortShopsByDistanceGoogle(shopsForDisplay, centerForSort);
    } else {
        // console.log("RENDER_LISTINGS: SKIPPING sort by distance. PerformSort:", performSort, "CenterForSort:", !!centerForSort);
    }

    if (typeof currentlyDisplayedShops !== 'undefined') { // currentlyDisplayedShops is global in main.js
        currentlyDisplayedShops = shopsForDisplay; // Update the global list of what's displayed
    }
    
    listingsContainer.innerHTML = ''; // Clear previous listings

    if (shopsForDisplay.length > 0) {
        if (noResultsDiv) noResultsDiv.classList.add('hidden');
        listingsContainer.classList.remove('hidden');

        shopsForDisplay.forEach(shop => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer group'; // Added group for potential group-hover
            card.classList.add('w-full', 'px-1', 'sm:px-2', 'mb-2', 'sm:mb-4');
            // Use a robust unique identifier if GoogleProfileID is not always present. Fallback to Name + Address (slugified)
            const shopIdentifier = shop.GoogleProfileID || (shop.Name + (shop.Address || '')).replace(/[^a-zA-Z0-9]/g, '-');
            card.setAttribute('data-shop-id', shopIdentifier);

            let actualImageUrl;
            const placeholderText = encodeURIComponent(shop.Name.split(' ').slice(0, 2).join(' ') || 'Farm Stand');
            const fallbackImageUrl = `https://placehold.co/400x250/E0E0E0/757575?text=${placeholderText}&font=inter`;

            if (shop.ImageOne && typeof shop.ImageOne === 'string' && shop.ImageOne.trim() !== '') {
                actualImageUrl = `images/${shop.ImageOne.trim()}`;
            } else {
                actualImageUrl = fallbackImageUrl;
            }
            
            let contactInfoHTML = '';
            const ratingContainerIdForThisCard = `rating-for-${shopIdentifier}`; // Use consistent identifier

            let initialStarsHTML = getStarRatingHTML("N/A"); // Default to "No rating"
            if (shop.placeDetails && typeof shop.placeDetails.rating === 'number') {
                initialStarsHTML = getStarRatingHTML(shop.placeDetails.rating, shop.placeDetails.user_ratings_total);
            } else if (shop.Rating && shop.Rating !== "N/A") { // Fallback to CSV rating if placeDetails not yet loaded
                initialStarsHTML = getStarRatingHTML(shop.Rating); // CSV rating might not have review count
            }


            if (shop.Phone) {
                contactInfoHTML += `
                    <div class="w-full mb-1">
                        <a href="tel:${shop.Phone}" 
                           onclick="event.stopPropagation();" 
                           class="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all">
                           <svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                           ${shop.Phone}
                        </a>
                    </div>`;
            }

            if (shop.Website && shop.Website.trim() !== '' && !shop.Website.includes('googleusercontent.com')) {
                let displayWebsite = shop.Website;
                try {
                    const urlObj = new URL(shop.Website.startsWith('http') ? shop.Website : `http://${shop.Website}`);
                    displayWebsite = urlObj.hostname.replace(/^www\./, '');
                    if (displayWebsite.length > 25) displayWebsite = displayWebsite.substring(0, 22) + "...";
                } catch (e) { /* ignore if invalid URL, use original, maybe shorten */ 
                    if(displayWebsite.length > 25) displayWebsite = displayWebsite.substring(0,22) + "...";
                }

                contactInfoHTML += `
                    <div class="w-full">
                        <a href="${shop.Website.startsWith('http') ? shop.Website : `http://${shop.Website}`}" 
                           target="_blank" rel="noopener noreferrer" 
                           onclick="event.stopPropagation();" 
                           class="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all">
                           <svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-4-4a2 2 0 012.828-2.828l3 3a2 2 0 010 2.828l-2.086 2.086a.5.5 0 01-.707-.707L11.172 8.172l1.414-1.414-3-3a.5.5 0 01.707-.707l3 3zm4.707-1.414a3 3 0 00-4.242 0l-3 3a3 3 0 000 4.242l4 4a3 3 0 004.242 0l3-3a3 3 0 000-4.242l-3-3z" clip-rule="evenodd"></path></svg>
                           ${displayWebsite}
                        </a>
                    </div>`;
            }


            // Directions button on card
            if (shop.lat && shop.lng) { // Only show if lat/lng are available for the shop
                 contactInfoHTML += `
                    <div class="w-full mt-2">
                        <button data-shopid="${shopIdentifier}" class="listing-get-directions-button inline-flex items-center justify-center w-full px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                           <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                           Directions
                        </button>
                    </div>`;
            }
            
            let distanceText = '';
            if (shop.distance !== undefined && shop.distance !== Infinity && shop.distance !== null) {
                const distKm = (shop.distance / 1000);
                const distMiles = kmToMiles(distKm);
                distanceText = `<p class="text-xs text-blue-500 mt-1">~${distMiles.toFixed(1)} mi / ${distKm.toFixed(1)} km away</p>`;
            }

            card.innerHTML = `
                <div class="aspect-w-16 aspect-h-9 sm:aspect-h-7">
                    <img class="w-full h-full object-cover" 
                         src="${actualImageUrl}" 
                         alt="Image of ${shop.Name}" 
                         onerror="this.onerror=null; this.src='${fallbackImageUrl}'; console.error('IMAGE LOAD ERROR for ${shop.Name}: ${actualImageUrl}');">
                </div>
                <div class="p-3 sm:p-4">
                    <div class="flex justify-between items-start mb-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-800 leading-tight truncate pr-2" title="${shop.Name}">${shop.Name}</h2>
                        <div id="${ratingContainerIdForThisCard}" class="shop-card-rating flex-shrink-0">
                            ${initialStarsHTML}
                        </div>
                    </div>
                    <p class="text-xs sm:text-sm text-gray-500 mb-0 truncate" title="${shop.Address || 'Address not available'}">
                        <svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                        ${shop.Address || 'Address not available'}
                    </p>
                    ${distanceText}
                    <div class="flex flex-col gap-1 mt-3 pt-3 border-t border-gray-200">
                        ${contactInfoHTML || '<p class="text-xs text-gray-400">No contact information.</p>'}
                    </div>
                </div>
            `;
            

            const directionsButtonOnCard = card.querySelector('.listing-get-directions-button');
            if (directionsButtonOnCard) {
                directionsButtonOnCard.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent card click if button is distinct
                    // console.log("UILOGIC: Directions button on card clicked for shop:", shop.Name);
                    
                    // Ensure overlays are open for this shop AND populated with THIS shop's data
                    if (typeof openClickedShopOverlays === 'function') {
                        openClickedShopOverlays(shop); // This populates overlays with current shop
                    }
                    // Then trigger directions.
                    // Use a slight delay to ensure the overlay (and its direction panel) is ready
                    setTimeout(() => {
                        if (typeof handleGetDirections === 'function') {
                            handleGetDirections(shop); // handleGetDirections is in this file (uiLogic.js)
                        } else {
                            console.error("handleGetDirections function not found in uiLogic.js");
                        }
                    }, 150);
                });
            }


            // ASYNCHRONOUSLY FETCH AND UPDATE RATING IF NEEDED (e.g., if not yet in shop.placeDetails)
            // This typically happens if the shop hasn't been clicked on the map yet to trigger placesService.getDetails
            // The populateAllShopsWithLatLng in main.js gets geometry, not full details like rating.
            if (!shop.placeDetails && shop.GoogleProfileID && typeof placesService !== 'undefined' && typeof google !== 'undefined') {
                if (!shop._isFetchingCardDetails) { // Add a flag to prevent multiple fetches
                    shop._isFetchingCardDetails = true;
                    placesService.getDetails({
                        placeId: shop.GoogleProfileID,
                        fields: ['rating', 'user_ratings_total'] // Only fetch what's needed for the card
                    }, (place, status) => {
                        shop._isFetchingCardDetails = false; 
                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                            // Store these minimal details. Full details are fetched when infowindow is shown.
                            shop.placeDetails = { 
                                ...shop.placeDetails, // Preserve existing geometry if any
                                rating: place.rating,
                                user_ratings_total: place.user_ratings_total
                            };
                            
                            const ratingDiv = document.getElementById(ratingContainerIdForThisCard);
                            if (ratingDiv && typeof getStarRatingHTML === 'function') {
                                ratingDiv.innerHTML = getStarRatingHTML(place.rating, place.user_ratings_total);
                            }
                        } else {
                            // console.warn(`Card rating fetch: PlacesService error for ${shop.Name} (ID: ${shop.GoogleProfileID}): ${status}`);
                        }
                    });
                }
            }

// --- THIS IS THE REVISED CLICK LISTENER FOR THE CARD ITSELF ---
            card.addEventListener('click', () => {
                console.log(`UILOGIC: Listing card clicked for shop: ${shop.Name}`);

                // 1. Open overlays and populate them with this shop's data
                if (typeof openClickedShopOverlays === 'function') {
                    openClickedShopOverlays(shop); // Pass the full shop object
                } else {
                    console.warn("UILOGIC: openClickedShopOverlays function is not defined.");
                }

                // 2. Show InfoWindow on the map for this shop
                // Use a slight delay to allow overlays to open/adjust and map to potentially pan.
                setTimeout(() => {
                    // console.log(`UILOGIC: Delayed action for listing click - showing infowindow for ${shop.Name}`);
                    if (typeof showInfoWindowForShop === 'function') {
                        // Pass the full shop object to showInfoWindowForShop, as it's now expected.
                        showInfoWindowForShop(shop); // mapLogic.js function
                    } else {
                        console.error("UILOGIC: showInfoWindowForShop function is not defined in mapLogic.js.");
                    }
                }, 100); // 100ms delay. Adjust if needed.

                // Optional: Highlight this card in the list
                document.querySelectorAll('#listingsContainer .bg-white.rounded-xl').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'));
                card.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            });
            // --- END OF REVISED CLICK LISTENER ---
            listingsContainer.appendChild(card);
        });
    } else {
        if (noResultsDiv) {
            const searchVal = (typeof searchInput !== 'undefined' && searchInput) ? searchInput.value : "";
            let noResultsMessage = 'No farm stands found.';
            if (searchVal.trim() !== "") {
                noResultsMessage += ` Try broadening your search.`;
            } else if (typeof GOOGLE_SHEET_DIRECT_URL !== 'undefined' && GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER) {
                noResultsMessage = 'Data source not configured. Please check `config.js`.';
            }
            noResultsDiv.textContent = noResultsMessage;
            noResultsDiv.classList.remove('hidden');
        }
        listingsContainer.classList.add('hidden'); // Ensure container itself is hidden if no results
    }
}


function populateInstagramTab(shop, instagramFeedContainerElement) {
    if (!instagramFeedContainerElement) { console.error("Instagram container not found in populateInstagramTab"); return; }
    instagramFeedContainerElement.innerHTML = ''; // Clear previous content

    const username = shop.InstagramUsername; // From apiService.js mapping (originally 'instagram' from CSV)

    if (username && username.trim() !== '') {
        const cleanUsername = username.replace('@', '').trim();
        // Check for pre-fetched embed code (if you implement that)
        // For now, just a link as embedding Instagram often requires backend or more complex JS.
        if (shop.InstagramRecentPostEmbedCode) { // If you had a column for this
            const embedWrapper = document.createElement('div');
            embedWrapper.className = 'instagram-embed-wrapper p-2'; // Add some padding
            // Sanitize HTML minimally or use a library if complex user-inputted HTML
            embedWrapper.innerHTML = shop.InstagramRecentPostEmbedCode; 
            instagramFeedContainerElement.appendChild(embedWrapper);
            // Trigger Instagram's JS to process the embed if it's loaded
            if (window.instgrm && window.instgrm.Embeds) {
                window.instgrm.Embeds.process();
            }
        }
        
        // Always provide a direct link
        const profileLink = document.createElement('a');
        profileLink.href = `https://www.instagram.com/${cleanUsername}/`;
        profileLink.target = "_blank";
        profileLink.rel = "noopener noreferrer";
        profileLink.className = "block text-center mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm";
        profileLink.innerHTML = `<svg class="inline-block w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166-.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997-1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747-.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068-1.18.053-1.847.28-2.377.48-.575.222-1.018.567-1.465 1.015-.447.447-.793.89-1.015 1.464-.2.53-.427 1.197-.48 2.378C2.024 8.556 2.012 8.925 2.012 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377.222.575.567 1.018 1.015 1.465.447.447.89.793 1.464 1.015.53.2 1.197.427 2.378.48 1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847-.28 2.377-.48.575-.222 1.018-.567 1.465-1.015.447.447.793-.89 1.015-1.464-.2-.53.427-1.197-.48-2.378.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377-.222-.575-.567-1.018-1.015-1.465-.447-.447-.793-.89-1.015-1.464-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg>
                           View @${cleanUsername} on Instagram`;
        instagramFeedContainerElement.appendChild(profileLink);

    } else {
        instagramFeedContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Instagram profile configured for this shop.</p>';
    }
}

function handleGetDirections(shop) {
    if (!shop) {
        alert("Shop data not available for directions.");
        return;
    }
    // console.log("UILOGIC: handleGetDirections called for shop:", shop.Name);
    // currentShopForDirections should already be set if an overlay is open for this shop.
    // This function primarily ensures the mapLogic's calculateAndDisplayRoute is called.

    // The destination for mapLogic.js calculateAndDisplayRoute can be:
    // 1. LatLng object: { lat: shop.lat, lng: shop.lng }
    // 2. Place ID string: shop.GoogleProfileID
    // 3. Address string: shop.Address
    // mapLogic.js will prefer LatLng if available.

    let destinationPayload = {};
    if (shop.lat && shop.lng) {
        destinationPayload = { lat: parseFloat(shop.lat), lng: parseFloat(shop.lng), Name: shop.Name }; // Pass Name for context
    } else if (shop.GoogleProfileID) {
        destinationPayload = { GoogleProfileID: shop.GoogleProfileID, Name: shop.Name };
        // console.warn("Using Place ID for directions destination for " + shop.Name + ". Lat/Lng preferred for calculateAndDisplayRoute.");
        // If shop.placeDetails exists from an infowindow load and has geometry, mapLogic might use it.
    } else if (shop.Address && shop.Address !== 'N/A') {
        destinationPayload = { Address: shop.Address, Name: shop.Name };
    } else {
        alert("Not enough information to get directions for " + shop.Name + ". Missing coordinates, Place ID, and address.");
        return;
    }

    if (typeof calculateAndDisplayRoute === 'function') { // calculateAndDisplayRoute is in mapLogic.js
        calculateAndDisplayRoute(destinationPayload); // Pass the prepared destination
    } else {
        console.error("calculateAndDisplayRoute function not found in mapLogic.js");
        alert("Directions functionality is currently unavailable.");
    }
}

// Helper to display shop reviews - ensure this exists if called (e.g. in openClickedShopOverlays)
// Example skeleton:
function displayShopReviews(placeDetails, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = ''; // Clear previous reviews

    if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'space-y-3'; // Tailwind classes for spacing
        placeDetails.reviews.forEach(review => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 rounded-md shadow-sm';
            let reviewHTML = `
                <div class="flex items-center mb-1">
                    ${review.profile_photo_url ? `<img src="${review.profile_photo_url}" alt="${review.author_name}" class="w-8 h-8 rounded-full mr-2">` : ''}
                    <strong class="text-sm text-gray-700">${review.author_name}</strong>
                    <span class="ml-auto text-xs text-gray-500">${review.relative_time_description}</span>
                </div>
                <div class="text-yellow-400 text-sm mb-1">${getStarRatingHTML(review.rating).match(/<span class="text-yellow-400 text-lg">([^<]+)<\/span>/)[1] || ''}</div>
                <p class="text-xs text-gray-600 leading-relaxed">${review.text || ''}</p>
            `;
            li.innerHTML = reviewHTML;
            ul.appendChild(li);
        });
        containerElement.appendChild(ul);
    } else {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Google reviews available for this shop.</p>';
    }
}