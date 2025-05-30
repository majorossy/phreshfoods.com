// public/js/sharedHtml.js
'use strict';

/**
 * Generates HTML for star ratings.
 * @param {string|number} ratingStringOrNumber - The rating value.
 * @param {number} [reviewCount] - Optional number of reviews.
 * @returns {string} HTML string for star ratings.
 */
function getStarRatingHTML(ratingStringOrNumber, reviewCount) {
    const rating = parseFloat(ratingStringOrNumber);
    if (ratingStringOrNumber === "N/A" || isNaN(rating) || rating < 0 || rating > 5) {
        return `<div class="flex items-center text-sm text-gray-500">No rating available</div>`;
    }
    const numRating = parseFloat(rating.toFixed(1));
    const displayRatingValue = numRating.toFixed(1);
    const roundedForStarDisplay = Math.round(numRating * 2) / 2;

    const starSVGPath = "M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z";
    let starsHTML = `<span class="inline-flex items-center">`;
    for (let i = 1; i <= 5; i++) {
        let starClass = 'text-gray-300';
        if (i <= roundedForStarDisplay) starClass = 'text-yellow-400';
        starsHTML += `<svg class="w-4 h-4 fill-current ${starClass}" viewBox="0 0 20 20"><path d="${starSVGPath}"/></svg>`;
    }
    starsHTML += `</span>`;

    let reviewCountHTML = (typeof reviewCount === 'number' && reviewCount >= 0)
        ? `<span class="text-gray-500 group-hover:text-gray-700 group-hover:underline">(${reviewCount.toLocaleString()})</span>`
        : '';

    return `<div class="flex items-center gap-x-1 text-sm">
                <span class="font-semibold text-gray-700">${displayRatingValue}</span>
                ${starsHTML}
                ${reviewCountHTML}
            </div>`;
}

/**
 * Generates HTML for visual star ratings (just stars).
 * @param {string|number} ratingStringOrNumber - The rating value.
 * @param {string} [starSizeClass='w-5 h-5'] - Tailwind classes for star size.
 * @returns {string} HTML string for stars.
 */
function getStarsVisualHTML(ratingStringOrNumber, starSizeClass = 'w-5 h-5') {
    const rating = parseFloat(ratingStringOrNumber);
    if (ratingStringOrNumber === "N/A" || isNaN(rating) || rating < 0 || rating > 5) {
        return '<span class="text-sm text-gray-500">No rating</span>';
    }
    const roundedForStarDisplay = Math.round(rating);
    const starSVGPath = "M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z";
    let starsHTML = `<span class="inline-flex items-center">`;
    for (let i = 0; i < 5; i++) {
        starsHTML += `<svg class="${starSizeClass} fill-current ${i < roundedForStarDisplay ? 'text-yellow-400' : 'text-gray-300'}" viewBox="0 0 20 20"><path d="${starSVGPath}"/></svg>`;
    }
    starsHTML += `</span>`;
    return starsHTML;
}

/**
 * Generates HTML for a shop card or info window.
 * @param {Object} shop - The shop data object.
 * @param {string} [context='card'] - 'card' or 'infowindow'.
 * @returns {string} HTML string for the shop content.
 */
function generateShopContentHTML(shop, context = 'card') {
    if (!shop) return '<p class="text-center p-4">Shop data unavailable.</p>';
    if (typeof escapeHTML !== 'function') {
        console.error("generateShopContentHTML FATAL: escapeHTML function (utils.js) not available.");
        return '<p class="text-red-500">Error rendering shop (E02).</p>';
    }

    const placeholderText = encodeURIComponent(shop.Name?.split(' ').slice(0, 2).join(' ') || 'Farm Stand');
    const fallbackImageUrlCard = `https://placehold.co/400x250/E8DCC3/4A3B2C?text=${placeholderText}&font=inter`;
    const fallbackImageUrlBubble = `https://placehold.co/280x150/E8DCC3/4A3B2C?text=${placeholderText}&font=inter`;

    const actualImageUrl = (shop.ImageOne && shop.ImageOne.trim())
        ? `/images/${shop.ImageOne.trim()}`
        : (context === 'card' ? fallbackImageUrlCard : fallbackImageUrlBubble);

    let finalImageHTML = '';
    if (context === 'card') {
        finalImageHTML = `<div class="aspect-w-16 aspect-h-9 sm:aspect-h-7 bg-gray-200">
                            <img class="w-full h-full object-cover" loading="lazy" src="${actualImageUrl}" alt="Image of ${escapeHTML(shop.Name)}"
                                 onerror="this.onerror=null; this.src='${fallbackImageUrlCard}';">
                          </div>`;
    } else if (context === 'infowindow') {
        if (shop.ImageOne && shop.ImageOne.trim()) {
            finalImageHTML = `<img class="w-full h-auto object-cover rounded-t-sm mb-1" style="max-height: 130px;"
                                   src="${actualImageUrl}" alt="Image of ${escapeHTML(shop.Name)}"
                                   onerror="this.style.display='none';">`;
        }
    }

    const ratingSource = shop.placeDetails;
    const shopRating = (ratingSource && typeof ratingSource.rating === 'number')
        ? ratingSource.rating
        : (shop.Rating !== "N/A" ? shop.Rating : "N/A");
    const shopReviewCount = ratingSource?.user_ratings_total;
    let starsAndRatingHTML = getStarRatingHTML(shopRating, shopReviewCount);

    const uniqueIdPart = shop.slug || shop.GoogleProfileID || (shop.Name ? shop.Name.replace(/[^a-zA-Z0-9]/g, '') : 'unknown') + Math.random().toString(16).slice(2);
    const ratingContainerId = `rating-for-${uniqueIdPart}-${context}`;

    const iconMarginClass = (context === 'infowindow') ? "mr-1" : "mr-1.5";
    const iconClasses = `w-3.5 h-3.5 ${iconMarginClass} text-gray-500 flex-shrink-0`;
    const rowTextClasses = "text-xs sm:text-sm text-gray-700 truncate";
    const rowContainerClasses = "flex items-center";
    const detailRowsOuterDivClasses = (context === 'infowindow') ? "space-y-0.5 mt-1" : "space-y-1 mt-1.5";

    let detailRowsHTML = `<div class="${detailRowsOuterDivClasses}">`;
    if (shop.Address && shop.Address !== 'N/A') {
        detailRowsHTML += `<div class="${rowContainerClasses}" title="${escapeHTML(shop.Address)}"><svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg><span class="${rowTextClasses}">${escapeHTML(shop.Address)}</span></div>`;
    }

    let distanceString = '';
    if (shop.distance != null && shop.distance !== Infinity && typeof kmToMiles === 'function') {
         const distMiles = kmToMiles(shop.distance / 1000); distanceString = `~${distMiles.toFixed(1)} mi away`;
    }
    if (distanceString) {
        detailRowsHTML += `<div class="${rowContainerClasses}" title="${distanceString}"><svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg><span class="${rowTextClasses} text-blue-600 font-medium">${distanceString}</span></div>`;
    }

    if (shop.Phone) {
        detailRowsHTML += `<div class="${rowContainerClasses}" title="${escapeHTML(shop.Phone)}"><svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg><a href="tel:${shop.Phone}" onclick="event.stopPropagation();" class="${rowTextClasses} text-blue-600 hover:text-blue-800 hover:underline"><span class="truncate">${escapeHTML(shop.Phone)}</span></a></div>`;
    }
    if (shop.Website && shop.Website.trim() && !shop.Website.includes('googleusercontent.com')) {
        let displayWebsite = shop.Website; try { const urlObject = new URL(displayWebsite.startsWith('http') ? displayWebsite : `http://${displayWebsite}`); displayWebsite = urlObject.hostname.replace(/^www\./,''); const maxLen = context === 'infowindow' ? 22 : 30; if(displayWebsite.length > maxLen) displayWebsite = displayWebsite.substring(0,maxLen-3)+"...";} catch(e){ const maxLen = context === 'infowindow' ? 22 : 30; if(displayWebsite.length > maxLen) displayWebsite = displayWebsite.substring(0,maxLen-3)+"...";}
        detailRowsHTML += `<div class="${rowContainerClasses}" title="${escapeHTML(shop.Website)}"><svg class="${iconClasses}" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-4-4a2 2 0 012.828-2.828l3 3a2 2 0 010 2.828l-2.086 2.086a.5.5 0 01-.707-.707L11.172 8.172l1.414-1.414-3-3a.5.5 0 01.707-.707l3 3zm4.707-1.414a3 3 0 00-4.242 0l-3 3a3 3 0 000 4.242l4 4a3 3 0 004.242 0l3-3a3 3 0 000-4.242l-3-3z" clip-rule="evenodd"></path></svg><a href="${shop.Website.startsWith('http')?shop.Website:`http://${shop.Website}`}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="${rowTextClasses} text-blue-600 hover:text-blue-800 hover:underline"><span class="truncate">${escapeHTML(displayWebsite)}</span></a></div>`;
    }
    detailRowsHTML += '</div>';

    let directionsButtonHTML = '';
    if (context === 'infowindow') {
        const shopIdentifier = shop.slug || shop.GoogleProfileID || (shop.Name ? shop.Name.replace(/[^a-zA-Z0-9-]/g, '') : 'unknown') + Math.random().toString(16).slice(2);
        if (shopIdentifier) {
            const safeIdentifier = String(shopIdentifier).replace(/'/g, "\\'");
            directionsButtonHTML = `<button onclick="handleInfoWindowDirectionsClickById('${safeIdentifier}')" class="infowindow-directions-button mt-2 w-full text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded-sm transition-colors">Directions</button>`;
        } else {
             directionsButtonHTML = '';
        }
    }

    const nameSizeClass = (context === 'card') ? "text-base sm:text-lg" : "text-md";
    const textContentPaddingClass = (context === 'card') ? "p-3 sm:p-4" : "p-2 pt-1.5";
    const nameMarginClass = "mb-0.5";
    const ratingMarginClass = (context === 'infowindow') ? "mb-1" : "mb-1.5";

    const textAndContactContent = `
        <div class="${textContentPaddingClass} flex-grow flex flex-col">
            <h2 class="${nameSizeClass} font-semibold text-gray-800 leading-tight truncate ${nameMarginClass}" title="${escapeHTML(shop.Name)}">${escapeHTML(shop.Name)}</h2>
            <div id="${ratingContainerId}" class="shop-card-rating ${ratingMarginClass}">${starsAndRatingHTML}</div>
            ${detailRowsHTML}
            ${directionsButtonHTML}
            <div class="mt-auto"></div>
        </div>`;

    if (context === 'infowindow') {
        return `<div class="infowindow-content-wrapper flex flex-col bg-white rounded-md shadow-lg overflow-hidden p-0" style="font-family: 'Inter', sans-serif; max-width: 280px; min-width: 240px; font-size: 13px;">
                    ${finalImageHTML}
                    ${textAndContactContent}
                </div>`;
    }
    return `<div class="flex flex-col h-full">${finalImageHTML}${textAndContactContent}</div>`;
}