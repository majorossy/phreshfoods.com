// public/js/listingsRenderer.js
'use strict';

function renderListings(shopsToRender, performSort = true, sortCenter = null) {
    const { listingsContainer, noResultsDiv, searchAutocompleteElement } = AppState.dom; // Use searchAutocompleteElement
    if (!listingsContainer) { console.error("Listings container not found."); return; }

    let shopsForDisplay = [...(shopsToRender || [])];
    const currentMapCenter = sortCenter || (typeof map !== 'undefined' && map?.getCenter ? map.getCenter() : null);

    if (performSort && currentMapCenter && typeof sortShopsByDistanceGoogle === 'function') {
        shopsForDisplay = sortShopsByDistanceGoogle(shopsForDisplay, currentMapCenter);
    }
    AppState.currentlyDisplayedShops = shopsForDisplay; // Update AppState
    listingsContainer.innerHTML = ''; // Clear previous listings

    if (shopsForDisplay.length > 0) {
        if (noResultsDiv) noResultsDiv.classList.add('hidden');
        listingsContainer.classList.remove('hidden');

        shopsForDisplay.forEach(shop => {
            const card = document.createElement('div');
            // Use slug or a combination for a unique ID, ensuring it's valid for HTML attributes
            const shopIdSuffix = shop.slug || shop.GoogleProfileID || shop.Name?.replace(/\W/g, '') || Math.random().toString(16).slice(2);
            const cardId = `shop-card-${shopIdSuffix}`;
            card.id = cardId;
            card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group w-full flex flex-col h-full';
            card.setAttribute('data-shop-slug', shop.slug || ''); // Store slug for navigation

            // generateShopContentHTML will now use shop.placeDetails if populated by the background job
            card.innerHTML = generateShopContentHTML(shop, 'card');

            // The block for fetching individual card ratings is no longer needed here,
            // as generateShopContentHTML should handle displaying ratings from shop.placeDetails.
            // Any further details (like full reviews, photos, live opening hours)
            // will be fetched when the user clicks to open overlays/InfoWindow.

            card.addEventListener('click', () => {
                if (typeof navigateToStoreBySlug === 'function') {
                    navigateToStoreBySlug(shop);
                } else {
                    console.warn("navigateToStoreBySlug not defined. Opening overlays directly.");
                    if (typeof openClickedShopOverlays === 'function') openClickedShopOverlays(shop);
                }
                // Highlight logic
                document.querySelectorAll('#listingsContainer .bg-white.rounded-xl').forEach(el => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'));
                card.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            });
            listingsContainer.appendChild(card);
        });
    } else {
        // No results logic
        if (noResultsDiv) {
            const searchVal = searchAutocompleteElement ? searchAutocompleteElement.value : ""; // Use new element
            let msg = 'No farm stands found.';
            if (searchVal.trim() !== "") msg += ` Matching "${typeof escapeHTML === 'function' ? escapeHTML(searchVal) : searchVal}".`;
            else if (Object.values(AppState.activeProductFilters || {}).some(v => v)) msg += ` With current filters.`;
            noResultsDiv.textContent = msg;
            noResultsDiv.classList.remove('hidden');
        }
        if (listingsContainer) listingsContainer.classList.add('hidden');
    }
}

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