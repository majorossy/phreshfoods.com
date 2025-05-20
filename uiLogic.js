// js/uiLogic.js

document.addEventListener('DOMContentLoaded', () => {
    window.detailsOverlayShopElement = document.getElementById('detailsOverlayShop');
    window.detailsOverlaySocialElement = document.getElementById('detailsOverlaySocial');
    window.shopDetailNameElement = document.getElementById('shopDetailName');
    window.socialLinksContainerElement = document.getElementById('socialLinksContainer');
    window.twitterTimelineContainerElement = document.getElementById('twitterTimelineContainer');

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
});

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
        return `<span class="text-sm text-gray-400">No rating</span>`;
    }
    let stars = '';
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
    if (!pageId) return '<!-- Error: Facebook Page ID missing. -->';
    const facebookPageLink = `https://www.facebook.com/${pageId}/`;
    const displayName = pageName || pageId;
    return `
<div class="fb-page" data-href="${facebookPageLink}" data-tabs="timeline" data-width="" data-height="500" data-small-header="true" data-adapt-container-width="true" data-hide-cover="true" data-show-facepile="false">
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
            { height: '450', theme: 'light', chrome: 'noheader nofooter noborders noscrollbar transparent', tweetLimit: 5 }
        );
        if (!promise || typeof promise.then !== 'function') {
            containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Twitter widget creation failed.</p>`;
            return;
        }
        promise.then(el => {
            if (el) {
                if (containerElement.childNodes.length === 0 || (containerElement.childNodes.length === 1 && containerElement.firstChild.tagName === 'P' && containerElement.firstChild.textContent.startsWith("Loading Twitter feed"))) {
                     containerElement.innerHTML = `<p class="text-sm text-orange-500 p-4">Timeline for @${cleanHandle} loaded, but might be empty.</p>`;
                }
            } else {
                containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Could not embed Twitter for @${cleanHandle}.</p>`;
            }
        }).catch(e => {
            console.error("Error creating Twitter timeline for @" + cleanHandle + ":", e);
            containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Error embedding Twitter for @${cleanHandle}.</p>`;
        });
    } catch (error) {
        console.error("Synchronous error calling createTimeline:", error);
        containerElement.innerHTML = `<p class="text-sm text-red-500 p-4">Failed to initiate Twitter embedding.</p>`;
    }
}

async function openClickedShopOverlays(shop) {
    if (!shop) { console.error("Shop data is null in openClickedShopOverlays."); return; }
    currentShopForDirections = shop;
    let shopOverlayActuallyOpened = false;
    let socialOverlayActuallyOpened = false;

    if (detailsOverlayShopElement) {
        openOverlay(detailsOverlayShopElement);
        detailsOverlayShopElement.scrollTop = 0;
        shopOverlayActuallyOpened = true;
    }
    if (detailsOverlaySocialElement) {
        openOverlay(detailsOverlaySocialElement);
        detailsOverlaySocialElement.scrollTop = 0;
        socialOverlayActuallyOpened = true;
    }

    if (shopOverlayActuallyOpened && detailsOverlayShopElement) {
        try {
            if (shopDetailNameElement) shopDetailNameElement.textContent = shop.Name || 'N/A';
            const galleryContainer = document.getElementById('shopImageGallery');
            if (galleryContainer) {
                galleryContainer.innerHTML = '';
                const imageFilenames = [shop.ImageOne, shop.ImageTwo, shop.ImageThree].filter(Boolean);
                if (imageFilenames.length > 0) {
                    imageFilenames.forEach(filename => {
                        const trimmedFilename = filename.trim();
                        if (!trimmedFilename) return;
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'gallery-image-container';
                        const img = document.createElement('img');
                        img.src = `images/${trimmedFilename}`;
                        img.alt = `${shop.Name || 'Shop'} image - ${trimmedFilename}`;
                        img.className = 'gallery-image';
                        img.onerror = function() { this.parentElement.innerHTML = '<p class="text-xs text-gray-500 text-center p-2">Image not found</p>'; };
                        imgContainer.appendChild(img);
                        galleryContainer.appendChild(imgContainer);
                    });
                } else {
                    galleryContainer.innerHTML = '<p class="text-sm text-gray-500 text-center p-4">No images available.</p>';
                }
            }
            const reviewsContainer = document.getElementById('shopReviewsContainer');
            if (reviewsContainer) {
                if (shop.placeDetails && shop.placeDetails.reviews && shop.placeDetails.reviews.length > 0) {
                    if (typeof displayShopReviews === "function") displayShopReviews(shop.placeDetails, reviewsContainer);
                } else {
                    reviewsContainer.innerHTML = '<p class="text-sm text-gray-500 text-center p-4">No reviews available.</p>';
                }
            }
            document.getElementById('getShopDirectionsButton')?.classList.remove('hidden');
            document.getElementById('clearShopDirectionsButton')?.classList.add('hidden');
            const directionsPanelDiv = document.getElementById('directionsPanel');
            if (directionsPanelDiv) directionsPanelDiv.innerHTML = "";
        } catch (e) { console.error("Error populating RIGHT overlay:", e); }
    }

    if (socialOverlayActuallyOpened && detailsOverlaySocialElement) {
        try {
            const fbPanel = document.getElementById('social-facebook');
            const twPanel = document.getElementById('social-twitter');
            const igPanel = document.getElementById('social-instagram');
            const fbContentContainer = document.getElementById('socialLinksContainer');
            const twContentContainer = document.getElementById('twitterTimelineContainer');
            const igContentContainer = document.getElementById('instagramFeedContainer');
            const allPanels = [fbPanel, twPanel, igPanel].filter(Boolean);
            const tabButtons = detailsOverlaySocialElement.querySelectorAll('.css-target-tab-button');
            let activeTabId = 'social-facebook';
            if (!shop.FacebookPageID && shop.TwitterHandle) activeTabId = 'social-twitter';
            else if (!shop.FacebookPageID && !shop.TwitterHandle && shop.InstagramUsername) activeTabId = 'social-instagram';

            const showTab = (tabId) => {
                allPanels.forEach(panel => { if (panel) panel.style.display = (panel.id === tabId) ? 'block' : 'none'; });
                tabButtons.forEach(btn => btn.classList.toggle('active-social-tab-js', btn.getAttribute('href') === `#${tabId}`));
                if (tabId === 'social-facebook' && fbContentContainer) {
                    if (shop.FacebookPageID) {
                        if (!fbContentContainer.querySelector('.fb-page') || fbContentContainer.dataset.currentPageId !== shop.FacebookPageID) {
                            fbContentContainer.innerHTML = generateFacebookPagePluginHTML(shop.FacebookPageID, shop.Name);
                            fbContentContainer.dataset.currentPageId = shop.FacebookPageID;
                            if (typeof FB !== 'undefined' && FB.XFBML) setTimeout(() => FB.XFBML.parse(fbContentContainer), 50);
                        }
                    } else { fbContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4">No Facebook Page configured.</p>'; }
                } else if (tabId === 'social-twitter' && twContentContainer) {
                    if (shop.TwitterHandle) {
                        if (twContentContainer.dataset.currentTwitterHandle !== shop.TwitterHandle) {
                            displayTwitterTimeline(shop.TwitterHandle, twContentContainer);
                            twContentContainer.dataset.currentTwitterHandle = shop.TwitterHandle;
                        }
                    } else { twContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4">No Twitter handle configured.</p>'; }
                } else if (tabId === 'social-instagram' && igContentContainer) {
                     if (shop.InstagramUsername) {
                        if (igContentContainer.dataset.currentInstaUser !== shop.InstagramUsername) {
                           populateInstagramTab(shop, igContentContainer);
                           igContentContainer.dataset.currentInstaUser = shop.InstagramUsername;
                        }
                    } else { igContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4">No Instagram profile configured.</p>'; }
                }
                if(detailsOverlaySocialElement) detailsOverlaySocialElement.scrollTop = 0;
            };
            tabButtons.forEach(button => {
                button.onclick = (e) => { e.preventDefault(); showTab(button.getAttribute('href').substring(1)); };
            });
            showTab(activeTabId);
        } catch (e) { console.error("Error populating LEFT social overlay:", e); }
    }
    if (shopOverlayActuallyOpened || socialOverlayActuallyOpened) document.body.style.overflow = 'hidden';
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
        if (typeof infowindow !== 'undefined' && infowindow && typeof infowindow.close === 'function') infowindow.close();
        document.body.style.overflow = '';
        currentShopForDirections = null;
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
    const fallbackImageWidthCard = 400; const fallbackImageHeightCard = 250;
    const fallbackImageUrlCard = `https://placehold.co/${fallbackImageWidthCard}x${fallbackImageHeightCard}/E0E0E0/757575?text=${placeholderText}&font=inter`;
    const fallbackImageUrlBubble = `https://placehold.co/280x150/E0E0E0/757575?text=${placeholderText}&font=inter`;

    if (shop.ImageOne && typeof shop.ImageOne === 'string' && shop.ImageOne.trim() !== '') {
        actualImageUrl = `images/${shop.ImageOne.trim()}`;
    } else {
        actualImageUrl = (context === 'card') ? fallbackImageUrlCard : fallbackImageUrlBubble;
    }

    let finalImageHTML = '';
    if (context === 'card') {
        finalImageHTML = `<div class="aspect-w-16 aspect-h-9 sm:aspect-h-7"><img class="w-full h-full object-cover" loading="lazy" src="${actualImageUrl}" alt="Image of ${shop.Name}" onerror="this.onerror=null; this.src='${fallbackImageUrlCard}';"></div>`;
    } else if (context === 'infowindow') {
        if (shop.ImageOne && shop.ImageOne.trim() !== '') { // Only show real image in infowindow
            finalImageHTML = `<img class="w-full h-auto object-cover mb-2 rounded-t-sm" style="max-height: 150px;" src="${actualImageUrl}" alt="Image of ${shop.Name}" onerror="this.style.display='none';">`;
        }
    }

    let starsHTML = getStarRatingHTML("N/A");
    if (shop.placeDetails && typeof shop.placeDetails.rating === 'number') {
        starsHTML = getStarRatingHTML(shop.placeDetails.rating, shop.placeDetails.user_ratings_total);
    } else if (shop.Rating && shop.Rating !== "N/A") {
        starsHTML = getStarRatingHTML(shop.Rating);
    }
    const ratingContainerId = `rating-for-${shop.GoogleProfileID || (shop.Name + (shop.Address || '')).replace(/[^a-zA-Z0-9]/g, '-')}-${context}`;

    let contactLinksHTML = '';
    if (shop.Phone) {
        contactLinksHTML += `<div class="w-full mb-1"><a href="tel:${shop.Phone}" onclick="${context === 'card' ? 'event.stopPropagation();' : ''}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all flex items-center"><svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg><span class="truncate">${shop.Phone}</span></a></div>`;
    }
    if (shop.Website && shop.Website.trim() !== '' && !shop.Website.includes('googleusercontent.com')) {
        let dW = shop.Website; try { const uO = new URL(dW.startsWith('http')?dW:`http://${dW}`); dW = uO.hostname.replace(/^www\./,''); const mL=context==='infowindow'?20:30; if(dW.length>mL)dW=dW.substring(0,mL-3)+"...";}catch(e){const mL=context==='infowindow'?20:30;if(dW.length>mL)dW=dW.substring(0,mL-3)+"...";}
        contactLinksHTML += `<div class="w-full"><a href="${shop.Website.startsWith('http')?shop.Website:`http://${shop.Website}`}" target="_blank" rel="noopener noreferrer" onclick="${context === 'card' ? 'event.stopPropagation();' : ''}" class="text-blue-600 hover:text-blue-800 hover:underline text-sm break-all flex items-center"><svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-4-4a2 2 0 012.828-2.828l3 3a2 2 0 010 2.828l-2.086 2.086a.5.5 0 01-.707-.707L11.172 8.172l1.414-1.414-3-3a.5.5 0 01.707-.707l3 3zm4.707-1.414a3 3 0 00-4.242 0l-3 3a3 3 0 000 4.242l4 4a3 3 0 004.242 0l3-3a3 3 0 000-4.242l-3-3z" clip-rule="evenodd"></path></svg><span class="truncate">${dW}</span></a></div>`;
    }

    let directionsButtonHTML = '';
    const shopIdForButton = shop.GoogleProfileID || (shop.Name + (shop.Address || '')).replace(/[^a-zA-Z0-9]/g, '-');
    if (shop.lat && shop.lng) {
        const buttonClasses = "inline-flex items-center justify-center w-full px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors";
        let buttonAction = '';
        if (context === 'card') {
            buttonAction = `event.stopPropagation(); document.getElementById('listing-btn-directions-${shopIdForButton}').dispatchEvent(new CustomEvent('cardbuttondirectionsclick', { bubbles: true }));`;
        } else {
            // NEW: Create a plain data object for stringification, excluding complex/circular objects
            const shopDataForButton = {
                Name: shop.Name, Address: shop.Address, lat: shop.lat, lng: shop.lng,
                GoogleProfileID: shop.GoogleProfileID,
                ImageOne: shop.ImageOne, ImageTwo: shop.ImageTwo, ImageThree: shop.ImageThree, // Pass image names if overlays use them
                Phone: shop.Phone, Website: shop.Website, FacebookPageID: shop.FacebookPageID,
                TwitterHandle: shop.TwitterHandle, InstagramUsername: shop.InstagramUsername
                // DO NOT pass shop.marker or the full shop.placeDetails object here
            };
            const shopDataString = encodeURIComponent(JSON.stringify(shopDataForButton));
            buttonAction = `handleInfoWindowDirectionsClick(JSON.parse(decodeURIComponent('${shopDataString}'))); return false;`;
        }
        directionsButtonHTML = `<div class="w-full mt-2"><button id="listing-btn-directions-${shopIdForButton}${context === 'infowindow' ? '-iw' : ''}" data-shopid="${shopIdForButton}" class="${buttonClasses} ${context === 'card' ? 'listing-get-directions-button' : 'infowindow-get-directions-button'}" onclick="${buttonAction}"><svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>Directions</button></div>`;
    }
    
    let finalContactInfoHTML = contactLinksHTML + directionsButtonHTML;

    if (context === 'infowindow' && shop.placeDetails && shop.placeDetails.url && !directionsButtonHTML) {
        finalContactInfoHTML += `<div class="mt-2"><a href="${shop.placeDetails.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 6px 10px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 4px; font-size: 0.75rem;">View on Google Maps</a></div>`;
    }
    
    let distanceText = '';
    if (shop.distance !== undefined && shop.distance !== Infinity && shop.distance !== null) {
        const distKm = (shop.distance / 1000); const distMiles = kmToMiles(distKm);
        distanceText = `<p class="text-xs text-blue-500 mt-1">~${distMiles.toFixed(1)} mi / ${distKm.toFixed(1)} km away</p>`;
    } else if (context === 'infowindow' && typeof map !== 'undefined' && map && map.getCenter() && shop.lat && shop.lng) {
        try {
            const shopLoc = new google.maps.LatLng(parseFloat(shop.lat), parseFloat(shop.lng));
            const mapCenter = map.getCenter();
            if (shopLoc && mapCenter) {
                const distMeters = google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLoc);
                const distKm = (distMeters / 1000); const distMiles = kmToMiles(distKm);
                distanceText = `<p class="text-xs text-blue-500 mt-1">~${distMiles.toFixed(1)} mi / ${distKm.toFixed(1)} km from map center</p>`;
            }
        } catch(e) { /* silent */ }
    }

    const nameSizeClass = "text-lg sm:text-xl";
    const addressSizeClass = "text-xs sm:text-sm";
    let textContentPaddingClass = (context === 'card') ? "p-3 sm:p-4" : "p-2";
    if (context === 'infowindow' && finalImageHTML === '') { textContentPaddingClass = "p-2 pt-2"; }

    const textAndContactContent = `
        <div class="${textContentPaddingClass}">
            <h2 class="${nameSizeClass} font-semibold text-gray-800 leading-tight truncate mb-1" title="${shop.Name}">${shop.Name}</h2>
            <div id="${ratingContainerId}" class="shop-card-rating mb-2">${starsHTML}</div>
            <p class="${addressSizeClass} text-gray-500 mb-0 truncate" title="${shop.Address||'N/A'}"><svg class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>${shop.Address||'N/A'}</p>
            ${distanceText}
            <div class="flex flex-col gap-1 mt-3 pt-3 border-t border-gray-200">${finalContactInfoHTML || '<p class="text-xs text-gray-400">No contact.</p>'}</div>
        </div>`;

    if (context === 'infowindow') {
        return `<div class="infowindow-content-wrapper" style="font-family: 'Inter', sans-serif; max-width: 280px; font-size: 13px;">${finalImageHTML}${textAndContactContent}</div>`;
    }
    return `${finalImageHTML}${textAndContactContent}`;
}

function handleInfoWindowDirectionsClick(shopData) {
    if (typeof openClickedShopOverlays === 'function') {
        openClickedShopOverlays(shopData);
    }
    setTimeout(() => {
        if (typeof handleGetDirections === 'function') {
            handleGetDirections(shopData);
        }
    }, 100);
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
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer group w-full';
            card.setAttribute('data-shop-id', shopIdentifier);
            card.innerHTML = generateShopContentHTML(shop, 'card');
            const cardDirectionsButton = card.querySelector(`#listing-btn-directions-${shopIdentifier}`);
            if (cardDirectionsButton) {
                cardDirectionsButton.addEventListener('cardbuttondirectionsclick', () => {
                    if (typeof openClickedShopOverlays === 'function') openClickedShopOverlays(shop);
                    setTimeout(() => { if (typeof handleGetDirections === 'function') handleGetDirections(shop);}, 150);
                });
            }
            const ratingContainerIdForCard = `rating-for-${shopIdentifier}-card`;
            if (!shop.placeDetails && shop.GoogleProfileID && typeof placesService !== 'undefined' && typeof google !== 'undefined') {
                if (!shop._isFetchingCardDetails) { 
                    shop._isFetchingCardDetails = true;
                    placesService.getDetails({ placeId: shop.GoogleProfileID, fields: ['rating', 'user_ratings_total'] }, 
                        (place, status) => {
                            shop._isFetchingCardDetails = false; 
                            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                                shop.placeDetails = { ...shop.placeDetails, rating: place.rating, user_ratings_total: place.user_ratings_total };
                                const ratingDiv = document.getElementById(ratingContainerIdForCard);
                                if (ratingDiv) ratingDiv.innerHTML = getStarRatingHTML(place.rating, place.user_ratings_total);
                            }
                        }
                    );
                }
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
            if (searchVal.trim() !== "") noResultsMessage += ` Try broadening your search.`;
            else if (typeof GOOGLE_SHEET_DIRECT_URL !== 'undefined' && GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER) noResultsMessage = 'Data source not configured.';
            noResultsDiv.textContent = noResultsMessage;
            noResultsDiv.classList.remove('hidden');
        }
        listingsContainer.classList.add('hidden');
    }
}

function populateInstagramTab(shop, instagramFeedContainerElement) {
    if (!instagramFeedContainerElement) return;
    instagramFeedContainerElement.innerHTML = '';
    const username = shop.InstagramUsername;
    if (username && username.trim() !== '') {
        const cleanUsername = username.replace('@', '').trim();
        if (shop.InstagramRecentPostEmbedCode) {
            const embedWrapper = document.createElement('div');
            embedWrapper.className = 'instagram-embed-wrapper p-2';
            embedWrapper.innerHTML = shop.InstagramRecentPostEmbedCode; 
            instagramFeedContainerElement.appendChild(embedWrapper);
            if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
        }
        const profileLink = document.createElement('a');
        profileLink.href = `https://www.instagram.com/${cleanUsername}/`;
        profileLink.target = "_blank";
        profileLink.rel = "noopener noreferrer";
        profileLink.className = "block text-center mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm";
        profileLink.innerHTML = `<svg class="inline-block w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166-.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997-1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747-.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068-1.18.053-1.847.28-2.377.48-.575.222-1.018.567-1.465 1.015-.447.447-.793.89-1.015 1.464-.2.53-.427 1.197-.48 2.378C2.024 8.556 2.012 8.925 2.012 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377.222.575.567 1.018 1.015 1.465.447.447.89.793 1.464 1.015.53.2 1.197.427 2.378.48 1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847-.28 2.377-.48.575-.222 1.018-.567 1.465-1.015.447.447.793-.89 1.015-1.464-.2-.53.427-1.197-.48-2.378.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377-.222-.575-.567-1.018-1.015-1.465-.447-.447-.793-.89-1.015-1.464-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg>View @${cleanUsername} on Instagram`;
        instagramFeedContainerElement.appendChild(profileLink);
    } else {
        instagramFeedContainerElement.innerHTML = '<p class="text-sm text-gray-500 p-4">No Instagram profile configured.</p>';
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
    containerElement.innerHTML = ''; 
    if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'space-y-3';
        placeDetails.reviews.forEach(review => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 rounded-md shadow-sm';
            let reviewHTML = `
                <div class="flex items-center mb-1">
                    ${review.profile_photo_url ? `<img src="${review.profile_photo_url}" alt="${review.author_name}" class="w-8 h-8 rounded-full mr-2">` : ''}
                    <strong class="text-sm text-gray-700">${review.author_name}</strong>
                    <span class="ml-auto text-xs text-gray-500">${review.relative_time_description}</span>
                </div>
                <div class="text-yellow-400 text-sm mb-1">${getStarRatingHTML(review.rating).match(/<span class="text-yellow-400 text-lg">([^<]+)<\/span>/)?.[1] || ''}</div>
                <p class="text-xs text-gray-600 leading-relaxed">${review.text || ''}</p>`;
            li.innerHTML = reviewHTML;
            ul.appendChild(li);
        });
        containerElement.appendChild(ul);
    } else {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Google reviews available.</p>';
    }
}