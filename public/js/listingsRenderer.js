// public/js/listingsRenderer.js
'use strict';

/**
 * Renders the list of farm stand cards in the listings panel.
 * @param {Array<Object>} shopsToRender - Array of shop objects.
 * @param {boolean} [performSort=true] - Whether to sort by distance.
 * @param {Object} [sortCenter=null] - Google LatLng object for sorting center.
 */
function renderListings(shopsToRender, performSort = true, sortCenter = null) {
    const { listingsContainer, noResultsDiv, searchInput } = AppState.dom;
    if (!listingsContainer) { console.error("Listings container not found."); return; }

    let shopsForDisplay = [...(shopsToRender || [])];
    const currentMapCenter = sortCenter || (typeof map !== 'undefined' && map?.getCenter ? map.getCenter() : null);

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
            const shopId = shop.slug || shop.GoogleProfileID || (shop.Name ? shop.Name.replace(/\W/g, '-') : 'id') + Math.random().toString(16).slice(2);
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group w-full flex flex-col h-full';
            card.setAttribute('data-shop-id', shopId);
            card.innerHTML = generateShopContentHTML(shop, 'card'); // from sharedHtml.js

            const ratingContainerId = `rating-for-${shopId}-card`;
            const ratingDivInCard = card.querySelector(`#${ratingContainerId}`);

            // Fetch Google rating if needed
            if (!shop.placeDetails?.rating && shop.GoogleProfileID && typeof getPlaceDetailsClient === 'function' && !shop._isFetchingCardDetails) {
                shop._isFetchingCardDetails = true;
                getPlaceDetailsClient(shop.GoogleProfileID, 'rating,user_ratings_total')
                    .then(place => {
                        shop._isFetchingCardDetails = false;
                        if (place) {
                            shop.placeDetails = { ...(shop.placeDetails || {}), rating: place.rating, user_ratings_total: place.user_ratings_total };
                            if (ratingDivInCard && typeof getStarRatingHTML === 'function') ratingDivInCard.innerHTML = getStarRatingHTML(place.rating, place.user_ratings_total);
                        }
                    }).catch(err => { shop._isFetchingCardDetails = false; });
            } else if (shop.placeDetails?.rating && ratingDivInCard && typeof getStarRatingHTML === 'function') {
                ratingDivInCard.innerHTML = getStarRatingHTML(shop.placeDetails.rating, shop.placeDetails.user_ratings_total);
            }

            card.addEventListener('click', () => {
                if (typeof navigateToStoreBySlug === 'function') { // from main.js
                    navigateToStoreBySlug(shop);
                } else {
                    console.warn("navigateToStoreBySlug not defined. Opening overlays directly.");
                    if (typeof openClickedShopOverlays === 'function') openClickedShopOverlays(shop);
                }
                document.querySelectorAll('#listingsContainer .bg-white.rounded-xl').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'));
                card.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            });
            listingsContainer.appendChild(card);
        });
    } else {
        if (noResultsDiv) {
            const searchVal = searchInput ? searchInput.value : "";
            let msg = 'No farm stands found.';
            if (searchVal.trim() !== "") msg += ` Matching "${escapeHTML(searchVal)}".`;
            else if (Object.values(AppState.activeProductFilters || {}).some(v => v)) msg += ` With current filters.`;
            noResultsDiv.textContent = msg;
            noResultsDiv.classList.remove('hidden');
        }
        if (listingsContainer) listingsContainer.classList.add('hidden');
    }
}

/**
 * Sorts shops by distance from a given center using Google Maps geometry.
 * @param {Array<Object>} shops - Array of shop objects.
 * @param {Object} mapCenter - Google LatLng object.
 * @returns {Array<Object>} Sorted array of shop objects with 'distance' property.
 */
function sortShopsByDistanceGoogle(shops, mapCenter) {
    if (!google?.maps?.geometry?.spherical || !mapCenter || !shops) return shops;
    return shops.map(shop => {
        const shopLat = parseFloat(shop.lat);
        const shopLng = parseFloat(shop.lng);
        if (!isNaN(shopLat) && !isNaN(shopLng)) {
            const shopLocation = new google.maps.LatLng(shopLat, shopLng);
            return { ...shop, distance: google.maps.geometry.spherical.computeDistanceBetween(mapCenter, shopLocation) };
        }
        return { ...shop, distance: Infinity };
    }).sort((a, b) => a.distance - b.distance);
}