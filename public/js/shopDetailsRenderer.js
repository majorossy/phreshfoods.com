// public/js/shopDetailsRenderer.js
'use strict';

/**
 * Generates HTML for product icons within the shop details panel.
 * @param {Object} shop - The shop data object.
 * @returns {string} HTML string for product icons.
 */
// In shopDetailsRenderer.js

function generateProductIconsHTML(shop) {
    try {
        if (!shop) return '<p class="text-sm text-gray-500 text-center p-2 col-span-full">Product data unavailable.</p>';
        // Ensure config constants are loaded (typically from config.js)
        if (typeof PRODUCT_ICONS_CONFIG === 'undefined' || !PRODUCT_ICONS_CONFIG) {
            console.error("generateProductIconsHTML: PRODUCT_ICONS_CONFIG is not defined.");
            return '<p class="text-red-500 text-center p-2">Config error (P01).</p>';
        }
        if (typeof CATEGORY_DISPLAY_ORDER === 'undefined' || !CATEGORY_DISPLAY_ORDER) {
            console.error("generateProductIconsHTML: CATEGORY_DISPLAY_ORDER is not defined.");
            return '<p class="text-red-500 text-center p-2">Config error (C01).</p>';
        }
        if (typeof escapeHTML !== 'function') { // escapeHTML from utils.js
            console.error("generateProductIconsHTML: escapeHTML function is not defined.");
            return '<p class="text-red-500 text-center p-2">Utility error (E01).</p>';
        }

        const productsByCategory = {};
        for (const key in PRODUCT_ICONS_CONFIG) {
            if (Object.prototype.hasOwnProperty.call(PRODUCT_ICONS_CONFIG, key)) {
                const config = PRODUCT_ICONS_CONFIG[key];
                if (!config || typeof config.category !== 'string' || !config.name || !config.csvHeader) {
                    console.warn(`generateProductIconsHTML: Invalid configuration for product key "${key}". Skipping.`);
                    continue;
                }
                const category = config.category; // No 'Uncategorized' fallback needed if config is good
                if (!productsByCategory[category]) {
                    productsByCategory[category] = [];
                }
                productsByCategory[category].push({ key, ...config });
            }
        }

        let outerHTML = '<div class="space-y-4">';
        let atLeastOneCategoryRendered = false;

        CATEGORY_DISPLAY_ORDER.forEach(categoryName => {
            // Check if the category exists in our grouped products and has products defined for it
            if (productsByCategory[categoryName] && productsByCategory[categoryName].length > 0) {
                const productsInThisCategory = productsByCategory[categoryName];
                let categorySectionHTML = `<div class="category-section">
                                             <h4 class="text-sm font-semibold text-gray-700 mb-1.5 border-b border-gray-200 pb-1">${escapeHTML(categoryName)}</h4>
                                             <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-2 gap-y-2">`; // Tailwind classes for grid
                let iconsHTML_forThisCategory = "";

                productsInThisCategory.forEach(prodConfig => {
                    // We already checked for csvHeader and name when populating productsByCategory
                    const productPropertyKey = prodConfig.csvHeader;
                    let iconFileToUse = prodConfig.icon_unavailable || 'placeholder_icon.png'; // Default to unavailable or placeholder
                    let itemClasses = "product-icon-item flex flex-col items-center text-center p-1 opacity-50"; // Dimmed by default
                    let altText = `${escapeHTML(prodConfig.name)} (not available)`;

                    // Check the shop object for this product's availability
                    if (shop[productPropertyKey] === true) { // Assumes boolean true for available
                        iconFileToUse = prodConfig.icon_available || prodConfig.icon_unavailable || 'placeholder_icon.png'; // Prefer available, fallback
                        itemClasses = "product-icon-item flex flex-col items-center text-center p-1 rounded-md hover:bg-gray-100 transition-colors"; // Not dimmed
                        altText = escapeHTML(prodConfig.name);
                    }

                    iconsHTML_forThisCategory += `<div class="${itemClasses}" title="${altText}">
                                                    <img src="/images/icons/${iconFileToUse}" alt="${altText}"
                                                         class="w-10 h-10 sm:w-12 sm:h-12 object-contain mb-0.5"
                                                         loading="lazy"
                                                         onerror="this.style.display='none'; console.warn('Image not found: /images/icons/${iconFileToUse}');">
                                                    <span class="text-[0.7rem] sm:text-xs font-medium text-gray-600 leading-tight">${escapeHTML(prodConfig.name)}</span>
                                                  </div>`;
                });

                categorySectionHTML += iconsHTML_forThisCategory + `</div></div>`;
                outerHTML += categorySectionHTML; // Always add the category section if it has products configured
                atLeastOneCategoryRendered = true;
            }
        });

        outerHTML += '</div>';

        // If no categories had any products defined in PRODUCT_ICONS_CONFIG (unlikely if config is good),
        // or if CATEGORY_DISPLAY_ORDER was empty.
        if (!atLeastOneCategoryRendered) {
            return '<p class="text-sm text-gray-500 text-center p-2">No product categories configured for display.</p>';
        }

        return outerHTML;

    } catch (e) {
        console.error("ERROR in generateProductIconsHTML:", e);
        return '<p class="text-red-500 text-center p-2">Error displaying product icons.</p>';
    }
}

/**
 * Displays opening hours in the shop details panel.
 * @param {Object} placeDetails - Google Place Details object.
 * @param {HTMLElement} containerElement - The DOM element to populate.
 */
// public/js/shopDetailsRenderer.js
// ... (generateProductIconsHTML) ...

// public/js/shopDetailsRenderer.js

// ... (generateProductIconsHTML) ...

// public/js/shopDetailsRenderer.js

function displayOpeningHours(placeDetails, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = '';

    const overallStatusContainer = document.createElement('div');
    overallStatusContainer.className = 'text-center mb-4 text-sm'; // Added a bit more margin
    let isOpenNowText = '';
    let isOpenNowClass = 'text-gray-600';

    // --- "Open Now" Status Logic (same as before) ---
    if (placeDetails?.business_status && placeDetails.business_status !== "OPERATIONAL") {
        let statusMessage = "Hours may be out of date";
        if (placeDetails.business_status === "CLOSED_TEMPORARILY") statusMessage = "Temporarily Closed";
        else if (placeDetails.business_status === "CLOSED_PERMANENTLY") statusMessage = "Permanently Closed";
        isOpenNowText = statusMessage;
        isOpenNowClass = 'text-red-600 font-semibold';
    } else if (placeDetails?.opening_hours && typeof placeDetails.opening_hours.open_now === 'boolean') {
        isOpenNowText = placeDetails.opening_hours.open_now ? 'Open Now' : 'Closed Now';
        isOpenNowClass = placeDetails.opening_hours.open_now ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
    } else {
        isOpenNowText = 'Hours status unavailable';
    }

    if (isOpenNowText) {
        overallStatusContainer.innerHTML = `<p class="${isOpenNowClass}">${typeof escapeHTML === 'function' ? escapeHTML(isOpenNowText) : isOpenNowText}</p>`;
        containerElement.appendChild(overallStatusContainer);
    }
    // --- END "Open Now" Status ---

    if (placeDetails?.opening_hours?.weekday_text?.length === 7) {
        const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDayIndex = new Date().getDay();
        const googleHoursMap = new Map();

        placeDetails.opening_hours.weekday_text.forEach(text => {
            const colonIndex = text.indexOf(':');
            if (colonIndex > -1) {
                const dayName = text.substring(0, colonIndex).trim();
                const hoursString = text.substring(colonIndex + 1).trim();
                googleHoursMap.set(dayName, hoursString || 'Closed');
            }
        });

        const hoursGrid = document.createElement('div');
        // Grid structure for the 7 days
        hoursGrid.className = 'grid grid-cols-7 border-t border-l border-gray-300 shadow-md'; // Add top/left border to grid for calendar look

        daysOrder.forEach((dayFullName, index) => {
            const dayCell = document.createElement('div');
            const isToday = index === todayDayIndex;
            
            // Cell styling: add right/bottom borders to each cell for grid lines
            dayCell.className = `day-cell bg-white p-2 border-r border-b border-gray-300 min-h-[70px] flex flex-col items-center justify-start ${isToday ? 'bg-blue-50 font-semibold relative' : ''}`;
            
            const dayNameElement = document.createElement('div');
            dayNameElement.className = `day-name text-xs font-medium ${isToday ? 'text-blue-700' : 'text-gray-500'} uppercase mb-1`;
            dayNameElement.textContent = dayFullName.substring(0, 3);

            const hoursElement = document.createElement('div');
            hoursElement.className = `day-hours text-xs ${isToday ? 'text-blue-600' : 'text-gray-700'} leading-tight text-center`;

            let hoursText = googleHoursMap.get(dayFullName) || 'N/A';
            let cleanedHoursText = hoursText.replace(/[\u2013\u2014]/g, '-').replace(/[\u2009\u00A0]/g, ' ');

            if (hoursText.toLowerCase().includes('closed')) {
                hoursElement.classList.add('text-red-500');
                cleanedHoursText = "Closed"; // Use consistent "Closed" text
            } else if (hoursText.toLowerCase().includes('open 24 hours')) {
                hoursElement.classList.add('text-green-600');
                cleanedHoursText = "24 Hours";
            } else if (hoursText === 'N/A') {
                hoursElement.classList.add('text-gray-400');
                cleanedHoursText = "N/A";
            }

            // Attempt to make multi-line if "TIME - TIME" format
            // Regex to capture (TIME AM/PM) optionally, then "-", then (TIME AM/PM) optionally
            const timePartsMatch = cleanedHoursText.match(/^(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)\s*-\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)$/i);

            if (timePartsMatch && timePartsMatch.length === 3) {
                hoursElement.innerHTML = `
                    <span class="block">${timePartsMatch[1].trim()}</span>
                    <span class="block text-[0.65rem] text-gray-400">to</span>
                    <span class="block">${timePartsMatch[2].trim()}</span>`;
            } else {
                hoursElement.textContent = cleanedHoursText.trim();
            }

            if (isToday) { // Optional: Add a "Today" indicator
                const todayIndicator = document.createElement('div');
                todayIndicator.className = 'absolute top-1 right-1 text-[0.6rem] bg-blue-500 text-white px-1 rounded-sm';
                todayIndicator.textContent = 'Today';
                // dayCell.appendChild(todayIndicator); // Add if desired
            }
            
            dayCell.appendChild(dayNameElement);
            dayCell.appendChild(hoursElement);
            hoursGrid.appendChild(dayCell);
        });
        containerElement.appendChild(hoursGrid);

    } else if (!isOpenNowText || isOpenNowText === 'Hours status unavailable' || isOpenNowText === 'Hours information may be out of date.') {
        const defaultMessage = '<p class="text-sm text-gray-500 text-center p-2">Weekly hours not available.</p>';
        if (overallStatusContainer.parentElement) {
             if(!containerElement.querySelector('.grid')) {
                containerElement.innerHTML += defaultMessage;
             }
        } else {
            containerElement.innerHTML = defaultMessage;
        }
    }
}