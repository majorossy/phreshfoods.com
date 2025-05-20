document.addEventListener('DOMContentLoaded', () => {
    window.detailsOverlayShopElement = document.getElementById('detailsOverlayShop');
    window.detailsOverlaySocialElement = document.getElementById('detailsOverlaySocial');
    window.shopDetailNameElement = document.getElementById('shopDetailName'); 

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
                                setTimeout(() => FB.XFBML.parse(fbContentContainer), 50);
                             }
                        }
                         if (targetPanelId === 'social-instagram-panel' && window.instgrm && window.instgrm.Embeds) {
                            const igContentContainer = document.getElementById('instagramFeedContainer');
                            if (igContentContainer && igContentContainer.querySelector('.instagram-media')) {
                                setTimeout(() => window.instgrm.Embeds.process(), 50);
                            }
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
    // Removed data-height; will control with CSS. data-width="" allows adaptive width.
    // Added use_container_width="true" for more reliable full width behavior
    return `
<div class="fb-page" 
    data-href="${facebookPageLink}" 
    data-tabs="timeline" 
    data-width="" 
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
        // For Twitter, explicitly set height via JS options as it's more reliable than CSS for the timeline widget
        const timelineOptions = {
            height: '100%', // This might not directly work as expected, Twitter's widget is finicky with % height
            theme: 'light',
            chrome: 'noheader nofooter noborders noscrollbar transparent', // Remove scrollbar, let parent scroll
            tweetLimit: 10 // Show more tweets if space allows
        };
        // A more reliable approach for Twitter height is often to calculate parent height and pass a pixel value.
        // For now, we'll try with a large pixel value and let the parent container clip/scroll.
        // Or set a fixed pixel height that works well.
        // Let's try to make parent scroll if Twitter widget overflows by setting a large initial height for Twitter
        // and let the parent #twitterTimelineContainer handle the scrolling with flex-grow and overflow-y: auto.
        // We won't set height in JS for twitter for now, let CSS handle it.

        const promise = twttr.widgets.createTimeline(
            { sourceType: 'profile', screenName: cleanHandle },
            containerElement,
            { /* height removed, will be handled by CSS */
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
                 // Optional: If Twitter widget creates an iframe, try to style it
                const iframe = containerElement.querySelector('iframe');
                if (iframe) {
                    iframe.style.height = '100%'; // Attempt to make iframe take full height of its direct parent
                    iframe.style.minHeight = '400px'; // Ensure a minimum height
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


async function openClickedShopOverlays(shop) {
    if (!shop) { console.error("Shop data is null in openClickedShopOverlays."); return; }
    currentShopForDirections = shop; 
    let shopOverlayActuallyOpened = false;
    let socialOverlayActuallyOpened = false;

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
            const fbContentContainer = document.getElementById('socialLinksContainer');
            const twContentContainer = document.getElementById('twitterTimelineContainer');
            const igContentContainer = document.getElementById('instagramFeedContainer');
            const reviewsSocialContainer = document.getElementById('socialOverlayReviewsContainer');
            const googlePhotosContainer = document.getElementById('socialOverlayGooglePhotosContainer'); 

            if (fbContentContainer) {
                if (shop.FacebookPageID) {
                    // Check if it needs re-rendering only if ID changed or not present
                    if (!fbContentContainer.querySelector('.fb-page') || fbContentContainer.dataset.currentPageId !== shop.FacebookPageID) {
                        fbContentContainer.innerHTML = generateFacebookPagePluginHTML(shop.FacebookPageID, shop.Name);
                        fbContentContainer.dataset.currentPageId = shop.FacebookPageID;
                        // FB.XFBML.parse will be called when tab becomes active
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
                 if (shop.InstagramUsername) {
                    if (igContentContainer.dataset.currentInstaUser !== shop.InstagramUsername) {
                       populateInstagramTab(shop, igContentContainer); 
                       igContentContainer.dataset.currentInstaUser = shop.InstagramUsername;
                    }
                } else { igContentContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Instagram profile configured.</p>'; }
            }

            if (reviewsSocialContainer) reviewsSocialContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Loading reviews...</p>'; 
            if (googlePhotosContainer) googlePhotosContainer.innerHTML = '<p class="text-sm text-gray-500 p-4 col-span-full text-center">Loading Google Photos...</p>';

            if (shop.GoogleProfileID && typeof placesService !== 'undefined' && typeof google !== 'undefined') {
                if (!shop.placeDetails || !shop.placeDetails.reviews || !shop.placeDetails.photos) {
                    const fieldsToFetch = ['reviews', 'photos', 'rating', 'user_ratings_total', 'url', 'name', 'place_id'];
                    placesService.getDetails(
                        { placeId: shop.GoogleProfileID, fields: fieldsToFetch },
                        (place, status) => {
                            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                                shop.placeDetails = { ...shop.placeDetails, ...place }; 
                                if (reviewsSocialContainer) displayShopReviews(shop.placeDetails, reviewsSocialContainer);
                                if (googlePhotosContainer) displayGooglePlacePhotos(shop.placeDetails, googlePhotosContainer);
                            } else {
                                if (reviewsSocialContainer) displayShopReviews(null, reviewsSocialContainer); 
                                if (googlePhotosContainer) displayGooglePlacePhotos(null, googlePhotosContainer);
                                console.warn(`Place details (reviews/photos) failed for ${shop.Name}: ${status}`);
                            }
                        }
                    );
                } else { 
                     if (reviewsSocialContainer) displayShopReviews(shop.placeDetails, reviewsSocialContainer); 
                     if (googlePhotosContainer) displayGooglePlacePhotos(shop.placeDetails, googlePhotosContainer);
                }
            } else { 
                 if (reviewsSocialContainer) displayShopReviews(null, reviewsSocialContainer); 
                 if (googlePhotosContainer) displayGooglePlacePhotos(null, googlePhotosContainer); // Will show no GID message
            }

            let defaultTabTarget;
            if (shop.GoogleProfileID) {
                defaultTabTarget = 'social-photos-panel';
            } else if (shop.FacebookPageID) {
                defaultTabTarget = 'social-facebook-panel';
            } else if (shop.InstagramUsername) {
                defaultTabTarget = 'social-instagram-panel';
            } else if (shop.TwitterHandle) {
                defaultTabTarget = 'social-twitter-panel';
            } else {
                defaultTabTarget = 'social-photos-panel'; 
            }

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

                if (defaultTabTarget === 'social-facebook-panel' && typeof FB !== 'undefined' && FB.XFBML) {
                    const fbContentContainer = document.getElementById('socialLinksContainer');
                    if(fbContentContainer && fbContentContainer.querySelector('.fb-page')) {
                       setTimeout(() => FB.XFBML.parse(fbContentContainer), 100); 
                    }
                }
                if (defaultTabTarget === 'social-instagram-panel' && window.instgrm && window.instgrm.Embeds) {
                     const igContentContainer = document.getElementById('instagramFeedContainer');
                     if(igContentContainer && igContentContainer.querySelector('.instagram-media')) {
                        setTimeout(() => window.instgrm.Embeds.process(), 100);
                     }
                }
            }

        } catch (e) { console.error("Error populating LEFT social/reviews/photos overlay tabs:", e); }
    }

    if (shopOverlayActuallyOpened || socialOverlayActuallyOpened) {
        document.body.style.overflow = 'hidden'; 
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
        if (fbContent) {
            fbContent.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Loading Facebook feed...</p>'; // Reset placeholder
            fbContent.dataset.currentPageId = '';
        }
        const twContent = document.getElementById('twitterTimelineContainer');
        if (twContent) {
            twContent.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Loading Twitter feed...</p>'; // Reset placeholder
            twContent.dataset.currentTwitterHandle = '';
        }
        const igContent = document.getElementById('instagramFeedContainer');
        if (igContent) {
            igContent.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Instagram content will load here.</p>'; // Reset placeholder
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
        if (shop.ImageOne && shop.ImageOne.trim() !== '') { 
            finalImageHTML = `<img class="w-full h-auto object-cover mb-2 rounded-t-sm" style="max-height: 150px;" src="${actualImageUrl}" alt="Image of ${shop.Name}" onerror="this.style.display='none';">`;
        }
    }

    let starsHTML = getStarRatingHTML("N/A");
    let ratingSource = shop.placeDetails; 
    if (!ratingSource && shop.Rating && shop.Rating !== "N/A") { 
        starsHTML = getStarRatingHTML(shop.Rating); 
    } else if (ratingSource && typeof ratingSource.rating === 'number') {
        starsHTML = getStarRatingHTML(ratingSource.rating, ratingSource.user_ratings_total); 
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
            const shopDataForButton = { 
                Name: shop.Name, Address: shop.Address, lat: shop.lat, lng: shop.lng,
                GoogleProfileID: shop.GoogleProfileID,
                ImageOne: shop.ImageOne, ImageTwo: shop.ImageTwo, ImageThree: shop.ImageThree,
                Phone: shop.Phone, Website: shop.Website, FacebookPageID: shop.FacebookPageID,
                TwitterHandle: shop.TwitterHandle, 
                InstagramUsername: shop.InstagramUsername, InstagramRecentPostEmbedCode: shop.InstagramRecentPostEmbedCode,
                Rating: shop.Rating 
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
    const embedCode = shop.InstagramRecentPostEmbedCode; 

    if (username && username.trim() !== '' && embedCode && embedCode.trim() !== '') {
        const cleanUsername = username.replace('@', '').trim();
        
        const embedWrapper = document.createElement('div');
        embedWrapper.className = 'instagram-embed-wrapper p-2'; 
        embedWrapper.innerHTML = embedCode; 
        instagramFeedContainerElement.appendChild(embedWrapper);

        const profileLink = document.createElement('a');
        profileLink.href = `https://www.instagram.com/${cleanUsername}/`;
        profileLink.target = "_blank";
        profileLink.rel = "noopener noreferrer";
        profileLink.className = "block text-center mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm";
        profileLink.innerHTML = `<svg class="inline-block w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997-1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068-1.18.053-1.847.28-2.377.48-.575.222-1.018.567-1.465 1.015-.447.447-.793.89-1.015 1.464-.2.53-.427 1.197-.48 2.378C2.024 8.556 2.012 8.925 2.012 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377.222.575.567 1.018 1.015 1.465.447.447.89.793 1.464 1.015.53.2 1.197.427 2.378.48 1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847.28 2.377-.48.575.222 1.018.567 1.465 1.015.447.447.793-.89 1.015 1.464.2-.53.427-1.197-.48-2.378.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377-.222-.575-.567-1.018-1.015-1.465-.447-.447-.793-.89-1.015-1.464-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg>View @${cleanUsername} on Instagram`;
        instagramFeedContainerElement.appendChild(profileLink);

    } else if (username && username.trim() !== '') { 
         const cleanUsername = username.replace('@', '').trim();
         instagramFeedContainerElement.innerHTML = `<p class="text-sm text-gray-500 p-4">No recent post embed code found for @${cleanUsername}.</p>
            <a href="${shop.InstagramLink || `https://www.instagram.com/${cleanUsername}/`}" target="_blank" rel="noopener noreferrer" class="block text-center mt-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out text-sm">
            <svg class="inline-block w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.166.293 2.913.595a4.877 4.877 0 011.76 1.177c.642.641.997 1.378 1.177 2.125.302.747.537 1.64.595 2.912.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.058 1.272-.293 2.166-.595 2.913a4.877 4.877 0 01-1.177 1.76c-.641.642-1.378.997-2.125 1.177-.747.302-1.64.537-2.912.595-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.272-.058-2.166.293-2.913-.595a4.877 4.877 0 01-1.76-1.177c-.642-.641-.997-1.378-1.177 2.125-.302-.747-.537 1.64-.595-2.912-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.058-1.272.293 2.166.595 2.913a4.877 4.877 0 011.177-1.76c.641-.642 1.378.997 2.125 1.177.747.302 1.64.537 2.912.595L7.15 2.233C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.075 0-3.444.012-4.642.068-1.18.053-1.847.28-2.377.48-.575.222-1.018.567-1.465 1.015-.447.447-.793.89-1.015 1.464-.2.53-.427 1.197-.48 2.378C2.024 8.556 2.012 8.925 2.012 12s.012 3.444.068 4.642c.053 1.18.28 1.847.48 2.377.222.575.567 1.018 1.015 1.465.447.447.89.793 1.464 1.015.53.2 1.197.427 2.378.48 1.198.056 1.567.068 4.642.068s3.444-.012 4.642-.068c1.18-.053 1.847.28 2.377-.48.575.222 1.018.567 1.465 1.015.447.447.793-.89 1.015 1.464.2-.53.427-1.197-.48-2.378.056-1.198.068-1.567.068-4.642s-.012-3.444-.068-4.642c-.053-1.18-.28-1.847-.48-2.377-.222-.575-.567-1.018-1.015-1.465-.447-.447-.793-.89-1.015-1.464-.53-.2-1.197-.427-2.378-.48C15.444 3.977 15.075 3.965 12 3.965zM12 7.198a4.802 4.802 0 100 9.604 4.802 4.802 0 000-9.604zm0 7.994a3.192 3.192 0 110-6.384 3.192 3.192 0 010 6.384zm6.385-7.852a1.145 1.145 0 100-2.29 1.145 1.145 0 000 2.29z"></path></svg>View @${cleanUsername} on Instagram</a>`; 
    } else {
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
    containerElement.innerHTML = ''; 
    if (placeDetails && placeDetails.reviews && placeDetails.reviews.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'space-y-3';
        placeDetails.reviews.slice(0, 5).forEach(review => { 
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 rounded-md shadow-sm';
            const reviewStarsMatch = getStarRatingHTML(review.rating).match(/<span class="text-yellow-400 text-lg">([^<]+)<\/span>/);
            const reviewStars = reviewStarsMatch ? reviewStarsMatch[1] : '';

            let reviewHTML = `
                <div class="flex items-center mb-1">
                    ${review.profile_photo_url ? `<img src="${review.profile_photo_url.replace(/=s\d+(-c)?/, '=s40-c')}" alt="${review.author_name}" class="w-8 h-8 rounded-full mr-2">` : '<div class="w-8 h-8 rounded-full mr-2 bg-gray-200 flex items-center justify-center text-gray-400 text-xs"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clip-rule="evenodd" /></svg></div>'}
                    <strong class="text-sm text-gray-700 truncate" title="${review.author_name}">${review.author_name}</strong>
                    <span class="ml-auto text-xs text-gray-500 whitespace-nowrap">${review.relative_time_description}</span>
                </div>
                <div class="text-yellow-400 text-sm mb-1">${reviewStars}</div>
                <p class="text-xs text-gray-600 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer" title="Click to expand/collapse review">${review.text || ''}</p>`;
            li.innerHTML = reviewHTML;
            const reviewTextP = li.querySelector('p.text-xs');
            if (reviewTextP) {
                 reviewTextP.addEventListener('click', () => reviewTextP.classList.toggle('line-clamp-3'));
            }
            ul.appendChild(li);
        });
        containerElement.appendChild(ul);
         if (placeDetails.reviews.length > 5) {
            const viewMoreLink = document.createElement('a');
            viewMoreLink.href = placeDetails.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeDetails.name || '')}&query_place_id=${placeDetails.place_id || ''}`;
            viewMoreLink.target = "_blank";
            viewMoreLink.rel = "noopener noreferrer";
            viewMoreLink.className = "block text-center text-xs text-blue-600 hover:underline mt-3 pt-2 border-t border-gray-200";
            viewMoreLink.textContent = `View all ${placeDetails.reviews.length} reviews on Google Maps`;
            containerElement.appendChild(viewMoreLink);
        }

    } else {
        containerElement.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No Google reviews available for this shop.</p>';
    }
}
