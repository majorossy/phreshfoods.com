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
    overlay.classList.remove('hidden');
    overlay.classList.add('is-open');
}
function closeOverlay(overlay) {
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

function formatFacebookPostToHTML(post) {
    let postHTML = `<div class="facebook-post">`;
    if (post.created_time) {
        postHTML += `<p class="text-xs text-gray-500 mb-1">${new Date(post.created_time).toLocaleString()}</p>`;
    }
    if (post.message) {
        const linkedMessage = post.message.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
        postHTML += `<p class="text-sm text-gray-800 mb-2 whitespace-pre-wrap">${linkedMessage.replace(/\n/g, '<br>')}</p>`;
    }
    let imageUrl = post.full_picture;
    if (!imageUrl && post.attachments && post.attachments.data && post.attachments.data.length > 0) {
        const attachment = post.attachments.data[0];
        if (attachment.media && attachment.media.image) imageUrl = attachment.media.image.src;
        else if (attachment.subattachments && attachment.subattachments.data && attachment.subattachments.data.length > 0 && attachment.subattachments.data[0].media && attachment.subattachments.data[0].media.image) {
            imageUrl = attachment.subattachments.data[0].media.image.src;
        }
    }
    if (imageUrl) {
        postHTML += `<a href="${post.permalink_url}" target="_blank" rel="noopener noreferrer" class="block my-2"><img src="${imageUrl}" alt="Post image"></a>`;
    }
    postHTML += `<a href="${post.permalink_url}" target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">View on Facebook</a>`;
    postHTML += `</div>`;
    return postHTML;
}

function displayTwitterTimeline(twitterHandle, containerElement) {
    if (!containerElement) { console.error("Twitter container element not found."); return; }
    if (!twitterHandle) {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Twitter handle configured.</p>';
        return;
    }
    if (typeof twttr === 'undefined' || !twttr.widgets) {
        containerElement.innerHTML = '<p class="text-sm text-red-500 p-4">Twitter embedding script not ready.</p>';
        return;
    }
    containerElement.innerHTML = ''; // Clear previous
    twttr.widgets.createTimeline(
        { sourceType: 'profile', screenName: twitterHandle },
        containerElement,
        { height: '400', theme: 'light', tweetLimit: 3 } // tweetLimit is a suggestion
    ).then(el => {
        if (!el) containerElement.innerHTML = `<p class="text-sm text-gray-500 p-4">Could not embed Twitter timeline for @${twitterHandle}.</p>`;
    }).catch(e => {
        console.error("Error creating Twitter timeline:", e);
        containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Error embedding Twitter timeline.</p>`;
    });
}

async function openClickedShopOverlays(shop) {
    console.log("--- openClickedShopOverlays: START ---");
    if (!shop) { console.error("Critical Error: Shop data is null. Cannot open overlays."); return; }

    let canOpenRight = !!detailsOverlayShopElement;
if (canOpenRight && detailsOverlayShopElement) {
    // ...populate overlay...
    openOverlay(detailsOverlayShopElement);
    detailsOverlayShopElement.scrollTop = 0;
}
    let canOpenLeft = !!detailsOverlaySocialElement;
if (canOpenLeft && detailsOverlaySocialElement) {
    // ...populate overlay...
    openOverlay(detailsOverlaySocialElement);
    detailsOverlaySocialElement.scrollTop = 0;
}

    if (!canOpenLeft && !canOpenRight) { console.error("Critical: Main overlay containers not found."); return; }

    // Populate Right Overlay
    if (canOpenRight && detailsOverlayShopElement) {
        try {
            if (shopDetailNameElement) shopDetailNameElement.textContent = shop.Name || 'N/A';
            if (shopDetailRatingStarsElement) shopDetailRatingStarsElement.innerHTML = getStarRatingHTML(shop.Rating);
            if (shopDetailAddressElement) shopDetailAddressElement.textContent = shop.Address || 'N/A';
            if (shopDetailPhoneElement) {
                shopDetailPhoneElement.classList.toggle('hidden', !shop.Phone);
                if (shop.Phone) shopDetailPhoneElement.innerHTML = `<strong>Phone:</strong> <a href="tel:${shop.Phone}" class="text-blue-600 hover:underline">${shop.Phone}</a>`;
            }
            if (shopDetailWebsiteElement) {
                const showWebsite = shop.Website && !shop.Website.includes('googleusercontent.com');
                shopDetailWebsiteElement.classList.toggle('hidden', !showWebsite);
                if (showWebsite) shopDetailWebsiteElement.innerHTML = `<strong>Website:</strong> <a href="${shop.Website}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">${shop.Website}</a>`;
            }
            if (shopDetailMapLinkContainerElement) {
                shopDetailMapLinkContainerElement.classList.toggle('hidden', !shop.GoogleProfileID);
                if (shop.GoogleProfileID) shopDetailMapLinkContainerElement.innerHTML = `<a href="https://www.google.com/maps/search/?api=1&query_place_id=${shop.GoogleProfileID}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 border border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 transition-colors"><svg class="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>View on Google Maps</a>`;
            }
            if (shopDetailDistanceElement && shop.distance !== undefined && shop.distance !== Infinity) {
                const distKm = (shop.distance / 1000).toFixed(1);
                shopDetailDistanceElement.textContent = `~${distKm} km away`;
                shopDetailDistanceElement.classList.remove('hidden');
            } else if (shopDetailDistanceElement) {
                shopDetailDistanceElement.classList.add('hidden');
            }

            detailsOverlayShopElement.classList.remove('hidden');
            detailsOverlayShopElement.classList.add('is-open');
            detailsOverlayShopElement.scrollTop = 0;
        } catch (e) { console.error("Error populating RIGHT overlay:", e); }
    }

    // Populate Left Overlay
    if (canOpenLeft && detailsOverlaySocialElement) {
        try {
            if (socialLinksContainerElement) {
                socialLinksContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">Loading Facebook posts...</p>';
                if (shop.FacebookPageID) {
                    const postsResult = await fetchFacebookPosts(shop.FacebookPageID); // Ensure fetchFacebookPosts is defined
                    if (typeof postsResult === 'string') socialLinksContainerElement.innerHTML = postsResult;
                    else if (postsResult.length > 0) {
                        let allPostsHTML = ''; postsResult.forEach(post => { allPostsHTML += formatFacebookPostToHTML(post); });
                        socialLinksContainerElement.innerHTML = allPostsHTML;
                    } else socialLinksContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No recent public Facebook posts found.</p>';
                } else socialLinksContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Facebook Page ID configured.</p>';
            }
            if (twitterTimelineContainerElement) {
                 displayTwitterTimeline(shop.TwitterHandle, twitterTimelineContainerElement);
            }
            detailsOverlaySocialElement.classList.remove('hidden');
            detailsOverlaySocialElement.classList.add('is-open');
            detailsOverlaySocialElement.scrollTop = 0;
        } catch (e) { console.error("Error populating LEFT overlay:", e); }
    }

    if (detailsOverlayShopElement?.classList.contains('is-open') || detailsOverlaySocialElement?.classList.contains('is-open')) {
        document.body.style.overflow = 'hidden';
    }
    if (shop.lat && shop.lng && map) map.panTo(getAdjustedMapCenter({ lat: shop.lat, lng: shop.lng })); // Ensure map & getAdjustedMapCenter are defined
    console.log("--- openClickedShopOverlays: END ---");
}

// --- In uiLogic.js ---

function closeClickedShopOverlays() {
    console.log("--- closeClickedShopOverlays: START ---");

    let anOverlayWasOpen = false; // Flag to see if we actually closed something

    if (detailsOverlayShopElement && detailsOverlayShopElement.classList.contains('is-open')) {
        detailsOverlayShopElement.classList.remove('is-open');
        anOverlayWasOpen = true;
        console.log("Shop overlay closed.");
    }

    if (detailsOverlaySocialElement && detailsOverlaySocialElement.classList.contains('is-open')) {
        detailsOverlaySocialElement.classList.remove('is-open');
        anOverlayWasOpen = true;
        console.log("Social overlay closed.");
    }

    // Only attempt to close infowindow if an overlay was actually open and is now closed,
    // and if infowindow is a valid Google Maps InfoWindow object.
    if (anOverlayWasOpen) {
        if (typeof infowindow !== 'undefined' && infowindow && typeof infowindow.close === 'function') {
            console.log("Closing Google Maps infowindow as overlays are being closed.");
            infowindow.close();
        } else {
            console.warn("Tried to close infowindow, but it's not defined or not a valid InfoWindow object.");
        }
    }

    document.body.style.overflow = ''; // Restore body scroll
    console.log("--- closeClickedShopOverlays: END ---");
}

function sortShopsByDistanceGoogle(shops, mapCenter) {
    if (!google.maps.geometry || !google.maps.geometry.spherical) {
        console.warn("Google Maps Geometry library not loaded. Cannot sort by distance.");
        return shops;
    }
    if (!mapCenter || !shops || shops.length === 0) return shops;

    return shops.map(shop => {
        if (shop.lat !== undefined && shop.lng !== undefined) { // Check for undefined explicitly
            const shopLocation = new google.maps.LatLng(shop.lat, shop.lng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLocation);
            return { ...shop, distance: distance };
        }
        return { ...shop, distance: Infinity };
    }).sort((a, b) => a.distance - b.distance);
}


// --- In uiLogic.js (or wherever renderListings is defined) ---

// Ensure listingsPanelElement, listingsContainer, noResultsDiv are defined, e.g.:
// const listingsPanelElement = document.getElementById('your-listings-panel-id'); // Or the main container for listings
// const listingsContainer = document.getElementById('your-actual-listings-container-id'); // Where cards are appended
// const noResultsDiv = document.getElementById('your-no-results-div-id');
// And GOOGLE_SHEET_DIRECT_URL, URL_NOT_CONFIGURED_PLACEHOLDER are defined.
// And getStarRatingHTML is defined.

function renderListings(shopsToRender, performSort = true, sortCenter = null) {
    if (!listingsPanelElement) { // Assuming listingsPanelElement is the overall section
        console.error("Listings panel element not found in renderListings.");
        return;
    }
    if (!listingsContainer) { // listingsContainer is where individual cards go
        console.error("Listings container element not found in renderListings.");
        return;
    }
    if (!noResultsDiv) {
        console.error("No results div element not found in renderListings.");
        // return; // Decide if this is critical enough to stop rendering
    }


    let shopsForDisplay = [...shopsToRender];

    if (performSort && map) { // Ensure map is available
        const centerForSort = sortCenter || map.getCenter();
        if (centerForSort) {
            console.log("Sorting listings by distance from:", centerForSort.lat(), centerForSort.lng());
            shopsForDisplay = sortShopsByDistanceGoogle(shopsForDisplay, centerForSort); // Assuming sortShopsByDistanceGoogle is defined
        }
    }
    currentlyDisplayedShops = shopsForDisplay; // Assuming currentlyDisplayedShops is global or accessible

    listingsContainer.innerHTML = ''; // Clear previous listings from the specific container

    if (shopsForDisplay.length > 0) {
        if (noResultsDiv) noResultsDiv.classList.add('hidden');
        listingsContainer.classList.remove('hidden');

        shopsForDisplay.forEach(shop => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer';
            
            // Use GoogleProfileID if available, otherwise fall back to Name for the data attribute.
            // GoogleProfileID is preferred for linking to the map marker.
            const shopIdentifier = shop.GoogleProfileID || shop.Name;
            card.setAttribute('data-shop-id', shopIdentifier);

            const imageName = encodeURIComponent(shop.Name.split(' ')[0] + ' ' + (shop.Name.split(' ')[1] || 'Butcher'));
            const imageUrl = `https://placehold.co/400x250/E0E0E0/757575?text=${imageName}&font=inter`;
            
            let contactInfoHTML = '';
            if (shop.Phone) contactInfoHTML += `<a href="tel:${shop.Phone}" onclick="event.stopPropagation();" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>Call</a>`;
            if (shop.Website && !shop.Website.includes('googleusercontent.com')) contactInfoHTML += `<a href="${shop.Website}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-.707-.707a2 2 0 012.828-2.828l.707.707zm-4.242 0a2 2 0 00-2.828 2.828l3 3a2 2 0 002.828 0l.707-.707a2 2 0 00-2.828-2.828l-.707.707zM10 18a8 8 0 100-16 8 8 0 000 16z" clip-rule="evenodd"></path></svg>Website</a>`;
            if (shop.GoogleProfileID) contactInfoHTML += `<a href="https://www.google.com/maps/search/?api=1&query_place_id=${shop.GoogleProfileID}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>Map</a>`;

            let distanceText = '';
            if (shop.distance !== undefined && shop.distance !== Infinity) {
                const distKm = (shop.distance / 1000).toFixed(1); // Assuming distance is in meters
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

            // --- MODIFIED CLICK LISTENER ---
            card.addEventListener('click', () => {
                console.log(`Listing card clicked for shop ID: ${shopIdentifier}`);

                // 1. Open your existing shop overlay (if you still want this behavior)
                if (typeof openClickedShopOverlays === 'function') {
                    openClickedShopOverlays(shop); // Pass the full shop object
                } else {
                    console.warn("openClickedShopOverlays function is not defined.");
                }

                // 2. Show the InfoWindow on the map
                // We must use shop.GoogleProfileID for this, as it's the key for map markers and Places API.
                if (shop.GoogleProfileID) {
                    if (typeof showInfoWindowForShop === 'function') {
                        showInfoWindowForShop(shop.GoogleProfileID);
                    } else {
                        console.error("showInfoWindowForShop function is not defined. Make sure it's in mapLogic.js and accessible.");
                    }
                } else {
                    console.warn(`Cannot show InfoWindow for "${shop.Name}" as it's missing a GoogleProfileID.`);
                    // Optionally, you could still try to pan the map if lat/lng are known
                    if (shop.lat && shop.lng && map) {
                        map.panTo({lat: shop.lat, lng: shop.lng});
                        // map.setZoom(15); // Consider if you want to zoom
                    }
                }

                // Optional: Highlight this card in the list
                document.querySelectorAll('.bg-white.rounded-xl.shadow-lg').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')); // Remove previous highlights
                card.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2'); // Add highlight to current card
            });
            // --- END OF MODIFIED CLICK LISTENER ---

            listingsContainer.appendChild(card);
        });
    } else {
        if (noResultsDiv) {
            noResultsDiv.textContent = GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER ? '' : 'No butcher shops found matching your search or current view.';
            noResultsDiv.classList.toggle('hidden', GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER && document.readyState !== "complete");
        }
        listingsContainer.classList.add('hidden');
    }
}