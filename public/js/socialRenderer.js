// public/js/socialRenderer.js
'use strict';

/**
 * Generates HTML for the Facebook Page Plugin.
 * @param {string} pageId - Facebook Page ID.
 * @param {string} pageName - Name of the page for fallback link.
 * @returns {string} HTML string for the Facebook embed.
 */
function generateFacebookPagePluginHTML(pageId, pageName) {
    if (!pageId) return '';
    const facebookPageLink = `https://www.facebook.com/${encodeURIComponent(pageId)}/`;
    const displayName = escapeHTML(pageName || pageId);
    return `<div class="fb-page"
                 data-href="${facebookPageLink}"
                 data-tabs="timeline"
                 data-width="100%"
                 data-height="100%"
                 data-use-container-width="true"
                 data-small-header="true"
                 data-adapt-container-width="true"
                 data-hide-cover="true"
                 data-show-facepile="false">
              <blockquote cite="${facebookPageLink}" class="fb-xfbml-parse-ignore">
                <a href="${facebookPageLink}">${displayName}</a>
              </blockquote>
            </div>`;
}

/**
 * Embeds a Twitter timeline into a container element.
 * @param {string} twitterHandle - The Twitter handle (@ optional).
 * @param {HTMLElement} containerElement - The DOM element to populate.
 */
function displayTwitterTimeline(twitterHandle, containerElement) {
    if (!containerElement) { console.error("Twitter container not found."); return; }
    containerElement.innerHTML = '';
    if (!twitterHandle?.trim()) { containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Twitter handle.</p>'; return; }
    const cleanHandle = twitterHandle.replace('@', '').trim();
    if (!cleanHandle) { containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Invalid Twitter handle.</p>'; return; }

    containerElement.innerHTML = `<p class="text-sm text-gray-400 p-4 text-center">Loading Twitter for @${cleanHandle}...</p>`;

    if (typeof twttr?.widgets?.createTimeline !== 'function') {
        containerElement.innerHTML = '<p class="text-sm text-red-500 p-4 text-center">Twitter script not available.</p>';
        return;
    }
    try {
        twttr.widgets.createTimeline(
            { sourceType: 'profile', screenName: cleanHandle },
            containerElement,
            { theme: 'light', chrome: 'noheader nofooter noborders noscrollbar transparent', tweetLimit: 5 }
        ).then(el => {
            if (!el) containerElement.innerHTML = `<p class="text-sm text-red-500 p-4 text-center">Could not embed @${cleanHandle}.</p>`;
        }).catch(e => {
            console.error(`Error embedding Twitter @${cleanHandle}:`, e);
            containerElement.innerHTML = `<p class="text-sm text-red-500 p-4 text-center">Error embedding Twitter.</p>`;
        });
    } catch (error) {
        console.error(`Error initializing Twitter @${cleanHandle}:`, error);
        containerElement.innerHTML = `<p class="text-sm text-red-500 p-4 text-center">Failed to init Twitter.</p>`;
    }
}

/**
 * Populates the Instagram tab with an embed or link.
 * @param {Object} shop - The shop data object.
 * @param {HTMLElement} containerElement - The DOM element to populate.
 */
function populateInstagramTab(shop, containerElement) {
    if (!containerElement) return;
    const username = shop.InstagramUsername;
    const embedCode = shop.InstagramRecentPostEmbedCode;
    const instaLink = shop.InstagramLink;
    containerElement.innerHTML = '';

    if (username?.trim() && embedCode?.trim()) {
        const cleanUsername = username.replace('@', '').trim();
        containerElement.innerHTML = embedCode; // Insert embed code
        const profileLink = document.createElement('a');
        profileLink.href = instaLink || `https://www.instagram.com/${cleanUsername}/`;
        profileLink.target = "_blank";
        profileLink.rel = "noopener noreferrer";
        profileLink.className = "block text-center mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm";
        profileLink.innerHTML = `<svg class="inline-block w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997 1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068C8.176 4.019 7.51 4.246 6.98 4.446a3.23 3.23 0 00-1.464 1.015c-.448.447-.793.89-1.015 1.464c-.2.53-.427 1.197-.48 2.378C4.013 8.556 4 8.925 4 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377c.222.575.567 1.018 1.015 1.465c.447.447.89.793 1.464 1.015c.53.2 1.197.427 2.378.48c1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847-.28 2.377-.48c.575-.222 1.018-.567 1.465-1.015c.447-.447.793-.89 1.015-1.464c.2-.53.427-1.197.48-2.378c.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377c-.222-.575-.567 1.018-1.015-1.465c-.447-.447-.793-.89-1.015-1.464c-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg>View @${escapeHTML(cleanUsername)} on Instagram`;
        containerElement.appendChild(profileLink);
        if (typeof window.instgrm !== 'undefined' && window.instgrm.Embeds) {
            setTimeout(() => window.instgrm.Embeds.process(), 100);
        }
    } else if (username?.trim()) {
        const cleanUsername = username.replace('@', '').trim();
        containerElement.innerHTML = `<p class="text-sm text-gray-500 p-4 text-center">No recent post embed code.</p>
                                      <a href="${escapeHTML(instaLink || `https://www.instagram.com/${cleanUsername}/`)}" target="_blank" rel="noopener noreferrer"
                                         class="block text-center mt-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white ...">
                                         View @${escapeHTML(cleanUsername)} on Instagram
                                      </a>`;
    } else {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Instagram profile.</p>';
    }
}

/**
 * Displays Google Place Photos.
 * @param {Object} placeDetails - Google Place Details object.
 * @param {HTMLElement} containerElement - The DOM element to populate.
 */
function displayGooglePlacePhotos(placeDetails, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = '';

    if (placeDetails?.photos?.length > 0) {
        let googleApiKey = ''; // Attempt to find the key
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.src?.includes('maps.googleapis.com/maps/api/js')) {
                const urlParams = new URLSearchParams(script.src.split('?')[1]);
                if (urlParams.has('key')) { googleApiKey = urlParams.get('key'); break; }
            }
        }
        if (!googleApiKey) console.warn("Google API Key not found for photo URLs.");

        placeDetails.photos.slice(0, 9).forEach(photoObject => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'gallery-image-container google-photo-item';
            const img = document.createElement('img');

            if (photoObject.photo_reference && googleApiKey) {
                img.src = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoObject.photo_reference}&key=${googleApiKey}`;
            } else {
                imgContainer.innerHTML = `<p class="text-xs text-gray-500 p-2">Photo unavailable</p>`;
                containerElement.appendChild(imgContainer);
                return;
            }
            img.alt = `Photo of ${escapeHTML(placeDetails.name || 'the farm stand')}`;
            img.className = 'gallery-image';
            img.loading = 'lazy';
            img.onerror = function() { this.parentElement.innerHTML = '<p class="text-xs text-gray-500 p-2">Image load error</p>'; };
            imgContainer.appendChild(img);
            containerElement.appendChild(imgContainer);
        });
    } else {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 col-span-full text-center">No Google photos found.</p>';
    }
}

/**
 * Displays Google Place Reviews.
 * @param {Object} placeDetails - Google Place Details object.
 * @param {HTMLElement} containerElement - The DOM element to populate.
 */
function displayShopReviews(placeDetails, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = '';
    let summaryHTML = '';

    if (placeDetails?.rating != null && placeDetails?.user_ratings_total != null) {
        summaryHTML = `
            <div class="place-review-summary p-4 mb-4 border-b border-gray-200">
                <div class="flex items-center gap-x-3 sm:gap-x-4">
                    <div class="flex-shrink-0"><p class="text-4xl sm:text-5xl font-bold text-gray-800">${placeDetails.rating.toFixed(1)}</p></div>
                    <div class="flex flex-col">
                        <div class="stars-container">${getStarsVisualHTML(placeDetails.rating, 'w-5 h-5')}</div>
                        <p class="text-xs sm:text-sm text-gray-600 mt-1">${placeDetails.user_ratings_total.toLocaleString()} Google reviews</p>
                    </div>
                </div>
            </div>`;
    }

    if (placeDetails?.reviews?.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'space-y-3 px-4 pb-4';
        placeDetails.reviews.slice(0, 5).forEach(review => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 rounded-md shadow-sm';
            li.innerHTML = `
                <div class="flex items-center mb-1.5">
                    ${review.profile_photo_url ? `<img src="${review.profile_photo_url.replace(/=s\d+/,'=s40-c')}" alt="${escapeHTML(review.author_name)}" class="w-8 h-8 rounded-full mr-2.5">` : '<div class="w-8 h-8 rounded-full mr-2.5 bg-gray-200 ...">...</div>'}
                    <strong class="text-sm text-gray-700 truncate">${escapeHTML(review.author_name)}</strong>
                    <span class="ml-auto text-xs text-gray-500 whitespace-nowrap">${escapeHTML(review.relative_time_description)}</span>
                </div>
                <div class="review-stars-individual mb-1.5">${getStarRatingHTML(review.rating)}</div>
                <p class="text-xs text-gray-600 leading-relaxed line-clamp-3 hover:line-clamp-none cursor-pointer">${escapeHTML(review.text || '')}</p>`;
            const reviewTextPara = li.querySelector('p.text-xs');
            if (reviewTextPara) reviewTextPara.addEventListener('click', () => reviewTextPara.classList.toggle('line-clamp-3'));
            ul.appendChild(li);
        });
        containerElement.innerHTML = summaryHTML;
        containerElement.appendChild(ul);
        if (placeDetails.url) {
            const viewMoreLink = document.createElement('a');
            viewMoreLink.href = placeDetails.url; viewMoreLink.target = '_blank'; viewMoreLink.rel = 'noopener noreferrer';
            viewMoreLink.className = 'block text-center text-sm text-blue-600 hover:text-blue-800 hover:underline mt-3 p-2';
            viewMoreLink.textContent = 'View all reviews on Google';
            containerElement.appendChild(viewMoreLink);
        }
    } else {
        containerElement.innerHTML = summaryHTML || '<p class="text-sm text-gray-500 p-4 text-center">No Google reviews or rating data.</p>';
        if (summaryHTML) containerElement.innerHTML += '<p class="text-sm text-gray-500 p-4 text-center">No individual reviews.</p>';
    }
}