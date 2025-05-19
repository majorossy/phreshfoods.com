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

function getStarRatingHTML(ratingString) {
    const rating = parseFloat(ratingString);
    if (isNaN(rating)) return `<span class="text-sm text-gray-400">No rating</span>`;
    const rounded = Math.round(rating);
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < rounded ? '★' : '☆';
    return `<span class="text-yellow-400 text-lg">${stars}</span> <span class="text-gray-500 text-xs ml-1">(${ratingString})</span>`;
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







async function openClickedShopOverlays(shop) {
    console.log("--- openClickedShopOverlays: START ---", shop);
    if (!shop) { console.error("Critical Error: Shop data is null. Cannot open overlays."); return; }

    let canOpenRight = !!detailsOverlayShopElement;
    if (canOpenRight) {
        openOverlay(detailsOverlayShopElement); // Open first to ensure dimensions are available for map adjustment
        detailsOverlayShopElement.scrollTop = 0;
    }
    let canOpenLeft = !!detailsOverlaySocialElement;
    if (canOpenLeft) {
        openOverlay(detailsOverlaySocialElement);
        detailsOverlaySocialElement.scrollTop = 0;
    }

    if (!canOpenLeft && !canOpenRight) { console.error("Critical: Main overlay containers not found."); return; }

    // Populate Right Overlay (Shop Details)
    if (canOpenRight && detailsOverlayShopElement) {
        try {
            if (shopDetailNameElement) shopDetailNameElement.textContent = shop.Name || 'N/A';

            const galleryContainer = document.getElementById('shopImageGallery'); // Get gallery container
            if (galleryContainer) {
                galleryContainer.innerHTML = ''; // Clear previous images

                const imageUrls = [];
                if (shop.ImageOne) imageUrls.push(shop.ImageOne);
                if (shop.ImageTwo) imageUrls.push(shop.ImageTwo);
                if (shop.ImageThree) imageUrls.push(shop.ImageThree);
                console.log("aaaaaaaaaaaa to load image:", imageUrls); 
                if (imageUrls.length > 0) {
                    imageUrls.forEach(url => {
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'gallery-image-container'; // For styling

                        const img = document.createElement('img');                                            
                        console.log("urlurlurlurlurlurlurlurl to load image:", url);                          
                        img.src = `images/${url.trim()}`;
                        console.log("Attempting to load image:", img.src);
                        img.alt = `${shop.Name || 'Shop'} image`;
                        img.className = 'gallery-image'; // For styling
                        img.onerror = function() { // Basic error handling for broken image links
                            this.style.display = 'none'; // Hide broken image icon
                            // Optionally, show a placeholder or message
                            const errorText = document.createElement('p');
                            errorText.textContent = 'Image not available';
                            errorText.className = 'text-xs text-gray-500 text-center';
                            imgContainer.appendChild(errorText);
                        };
                        imgContainer.appendChild(img);
                        galleryContainer.appendChild(imgContainer);
                    });
                } else {
                    galleryContainer.innerHTML = '<p class="text-sm text-gray-500 text-center">No images available for this shop.</p>';
                }
            }




            // No need to open overlay again, already done
        } catch (e) { console.error("Error populating RIGHT overlay:", e); }
    }
// Inside async function openClickedShopOverlays(shop) { ...

    // Populate Left Overlay (Social Media)
    if (canOpenLeft && detailsOverlaySocialElement) {
        try {
            // 1. Facebook Page Plugin
            if (socialLinksContainerElement) { // Assuming socialLinksContainerElement is for Facebook
                if (shop.FacebookPageID) {
                    const pagePluginHTML = generateFacebookPagePluginHTML(shop.FacebookPageID, shop.Name || shop.FacebookPageID);
                    socialLinksContainerElement.innerHTML = pagePluginHTML;
                    if (typeof FB !== 'undefined' && FB.XFBML) {
                        setTimeout(() => {
                            FB.XFBML.parse(socialLinksContainerElement);
                            // console.log("FB.XFBML.parse called after timeout for FB container:", socialLinksContainerElement);
                        }, 100); 
                    } else {
                        console.warn("Facebook SDK (FB.XFBML) not available when trying to render Page Plugin.");
                    }
                } else {
                    socialLinksContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Facebook Page configured for this shop.</p>';
                }
            } else {
                console.warn("Facebook container (socialLinksContainerElement) not found.");
            }

            // 2. Twitter Timeline
            // Ensure twitterTimelineContainerElement is defined globally or passed correctly.
            // It should have been fetched in your DOMContentLoaded event listener along with others.
            if (twitterTimelineContainerElement) { 
                // The existing displayTwitterTimeline function handles its own logic including placeholder for no handle.
                displayTwitterTimeline(shop.TwitterHandle, twitterTimelineContainerElement);
            } else {
                console.warn("Twitter container (twitterTimelineContainerElement) not found.");
            }

            // 3. Instagram Feed/Link
            // Ensure instagramFeedContainerElement is defined globally or get it here
            const instagramFeedContainerElement = document.getElementById('instagramFeedContainer');
            if (instagramFeedContainerElement) {
                if (shop.InstagramUsername) {
                    instagramFeedContainerElement.innerHTML = ''; // Clear previous content or loading message

                    // Option A: Display a single recent post embed if available
                    if (shop.InstagramRecentPostEmbedCode) {
                        const embedWrapper = document.createElement('div');
                        embedWrapper.className = 'instagram-embed-wrapper';
                        embedWrapper.innerHTML = shop.InstagramRecentPostEmbedCode; // This is the <blockquote...> code
                        instagramFeedContainerElement.appendChild(embedWrapper);

                        // Tell Instagram's script to process the new embed
                        if (window.instgrm && window.instgrm.Embeds) {
                            window.instgrm.Embeds.process();
                        }

                        // Add a "View full profile" link below the embed
                        const profileLinkBelowEmbed = document.createElement('a');
                        profileLinkBelowEmbed.href = `https://www.instagram.com/${shop.InstagramUsername.replace('@', '')}/`;
                        profileLinkBelowEmbed.target = "_blank";
                        profileLinkBelowEmbed.rel = "noopener noreferrer";
                        profileLinkBelowEmbed.className = "block text-center mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm";
                        profileLinkBelowEmbed.innerHTML = `View all posts @${shop.InstagramUsername.replace('@', '')}`;
                        instagramFeedContainerElement.appendChild(profileLinkBelowEmbed);

                    } else {
                        // Option B: Only a link/button to their profile if no specific post embed
                        const profileLinkOnly = document.createElement('a');
                        profileLinkOnly.href = `https://www.instagram.com/${shop.InstagramUsername.replace('@', '')}/`;
                        profileLinkOnly.target = "_blank";
                        profileLinkOnly.rel = "noopener noreferrer";
                        profileLinkOnly.className = "inline-block px-6 py-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-150 ease-in-out";
                        profileLinkOnly.innerHTML = `
                            <svg class="inline-block w-5 h-5 mr-2 -mt-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997-1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747-.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068-1.18.053-1.847.28-2.377.48-.575.222-1.018.567-1.465 1.015-.447.447-.793.89-1.015 1.464-.2.53-.427 1.197-.48 2.378C2.024 8.556 2.012 8.925 2.012 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377.222.575.567 1.018 1.015 1.465.447.447.89.793 1.464 1.015.53.2 1.197.427 2.378.48 1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847.28 2.377-.48.575-.222 1.018.567 1.465 1.015.447.447.793.89 1.015 1.464-.2-.53.427-1.197-.48-2.378.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377-.222-.575-.567-1.018-1.015-1.465-.447-.447-.793-.89-1.015-1.464-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg>
                            View @${shop.InstagramUsername.replace('@', '')} on Instagram
                        `;
                        instagramFeedContainerElement.appendChild(profileLinkOnly);
                    }
                } else {
                    instagramFeedContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Instagram profile configured.</p>';
                }
            } else {
                 console.warn("Instagram container (instagramFeedContainerElement) not found.");
            }
            // Ensure overlay is scrolled to top after content potentially changes height
            if(detailsOverlaySocialElement) detailsOverlaySocialElement.scrollTop = 0;

        } catch (e) {
            console.error("Error populating LEFT social overlay:", e);
            // Optionally, provide fallback UI in case of error for all sections
            if (socialLinksContainerElement) socialLinksContainerElement.innerHTML = '<p class="text-sm text-red-500 p-4">Error loading Facebook content.</p>';
            if (twitterTimelineContainerElement) twitterTimelineContainerElement.innerHTML = '<p class="text-sm text-red-500 p-4">Error loading Twitter content.</p>';
            const instagramContainer = document.getElementById('instagramFeedContainer');
            if (instagramContainer) instagramContainer.innerHTML = '<p class="text-sm text-red-500 p-4">Error loading Instagram content.</p>';
        }
    }
// ... rest of the openClickedShopOverlays function

    if (detailsOverlayShopElement?.classList.contains('is-open') || detailsOverlaySocialElement?.classList.contains('is-open')) {
        document.body.style.overflow = 'hidden';
    }
    // Ensure map and getAdjustedMapCenter are defined and map is ready before panning
    if (shop.lat && shop.lng && typeof map !== 'undefined' && map && typeof getAdjustedMapCenter === 'function') {
        map.panTo(getAdjustedMapCenter({ lat: shop.lat, lng: shop.lng }));
    }
    console.log("--- openClickedShopOverlays: END ---");
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
    if (!google || !google.maps || !google.maps.geometry || !google.maps.geometry.spherical) {
        console.warn("Google Maps Geometry library not loaded. Cannot sort by distance.");
        return shops;
    }
    if (!mapCenter || !shops || shops.length === 0) return shops;

    return shops.map(shop => {
        if (shop.lat !== undefined && shop.lng !== undefined) {
            const shopLocation = new google.maps.LatLng(shop.lat, shop.lng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLocation);
            return { ...shop, distance: distance };
        }
        return { ...shop, distance: Infinity };
    }).sort((a, b) => a.distance - b.distance);
}

function renderListings(shopsToRender, performSort = true, sortCenter = null) {
    if (!listingsPanelElement) {
        console.error("Listings panel element not found in renderListings.");
        return;
    }
    if (!listingsContainer) {
        console.error("Listings container element not found in renderListings.");
        return;
    }
    // noResultsDiv check can remain as is

    let shopsForDisplay = [...shopsToRender];

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
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer';
            
            const shopIdentifier = shop.GoogleProfileID || shop.Name; // Keep this robust
            card.setAttribute('data-shop-id', shopIdentifier);

            const imageName = encodeURIComponent(shop.Name.split(' ')[0] + ' ' + (shop.Name.split(' ')[1] || 'Butcher'));
            const imageUrl = `https://placehold.co/400x250/E0E0E0/757575?text=${imageName}&font=inter`;
            
            let contactInfoHTML = '';
            if (shop.Phone) contactInfoHTML += `<a href="tel:${shop.Phone}" onclick="event.stopPropagation();" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>Call</a>`;
            if (shop.Website && !shop.Website.includes('googleusercontent.com')) contactInfoHTML += `<a href="${shop.Website}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-.707-.707a2 2 0 012.828-2.828l.707.707zm-4.242 0a2 2 0 00-2.828 2.828l3 3a2 2 0 002.828 0l.707-.707a2 2 0 00-2.828-2.828l-.707.707zM10 18a8 8 0 100-16 8 8 0 000 16z" clip-rule="evenodd"></path></svg>Website</a>`;
            if (shop.GoogleProfileID) contactInfoHTML += `<a href="https://www.google.com/maps/search/?api=1&query_place_id=${shop.GoogleProfileID}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>Map</a>`;

            let distanceText = '';
            if (shop.distance !== undefined && shop.distance !== Infinity) {
                const distKm = (shop.distance / 1000).toFixed(1);
                distanceText = `<p class="text-xs text-blue-500 mt-1">~${distKm} km away</p>`;
            }

            card.innerHTML = `
                <img class="w-full h-40 sm:h-48 object-cover" src="${imageUrl}" alt="Image of ${shop.Name}" onerror="this.onerror=null;this.src='https://placehold.co/400x250/E0E0E0/757575?text=No+Image&font=inter';">
                <div class="p-3 sm:p-4">
                    <div class="flex justify-between items-start mb-1">
                        <h2 class="text-lg sm:text-xl font-semibold text-gray-800 leading-tight truncate" title="${shop.Name}">${shop.Name}</h2>
                        ${getStarRatingHTML(shop.Rating)}
                    </div>
                    <p class="text-xs sm:text-sm text-gray-500 mb-0 truncate" title="${shop.Address}">
                        <svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                        ${shop.Address || 'Address not available'}
                    </p>
                    ${distanceText}
                    <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                        ${contactInfoHTML || '<p class="text-xs text-gray-400">No contact information available.</p>'}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                console.log(`Listing card clicked for shop ID: ${shopIdentifier}`);

                if (typeof openClickedShopOverlays === 'function') {
                    openClickedShopOverlays(shop);
                } else {
                    console.warn("openClickedShopOverlays function is not defined.");
                }

                if (shop.GoogleProfileID) {
                    if (typeof showInfoWindowForShop === 'function') {
                        showInfoWindowForShop(shop.GoogleProfileID);
                    } else {
                        console.error("showInfoWindowForShop function is not defined.");
                    }
                } else {
                    console.warn(`Cannot show InfoWindow for "${shop.Name}" as it's missing a GoogleProfileID.`);
                    if (shop.lat && shop.lng && typeof map !== 'undefined' && map) {
                        map.panTo({lat: shop.lat, lng: shop.lng});
                    }
                }

                document.querySelectorAll('#listingsContainer .bg-white.rounded-xl').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'));
                card.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            });
            listingsContainer.appendChild(card);
        });
    } else {
        if (noResultsDiv) {
            // Ensure GOOGLE_SHEET_DIRECT_URL and URL_NOT_CONFIGURED_PLACEHOLDER are defined (they are in config.js)
            noResultsDiv.textContent = (typeof GOOGLE_SHEET_DIRECT_URL !== 'undefined' && GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER) ? '' : 'No butcher shops found matching your search or current view.';
            noResultsDiv.classList.toggle('hidden', (typeof GOOGLE_SHEET_DIRECT_URL !== 'undefined' && GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER) && document.readyState !== "complete");
        }
        listingsContainer.classList.add('hidden');
    }
}