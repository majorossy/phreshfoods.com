// public/js/shopDetailsRenderer.js
'use strict';

/**
 * Generates HTML for product icons within the shop details panel.
 * @param {Object} shop - The shop data object.
 * @returns {string} HTML string for product icons.
 */
function generateProductIconsHTML(shop) {
    try {
        if (!shop) return '<p class="text-sm text-gray-500 text-center p-2 col-span-full">Product data unavailable.</p>';
        if (typeof PRODUCT_ICONS_CONFIG === 'undefined' || !PRODUCT_ICONS_CONFIG) return '<p class="text-red-500 text-center p-2">Config error (P01).</p>';
        if (typeof CATEGORY_DISPLAY_ORDER === 'undefined' || !CATEGORY_DISPLAY_ORDER) return '<p class="text-red-500 text-center p-2">Config error (C01).</p>';
        if (typeof escapeHTML !== 'function') return '<p class="text-red-500 text-center p-2">Utility error (E01).</p>';

        const productsByCategory = {};
        for (const key in PRODUCT_ICONS_CONFIG) {
            const config = PRODUCT_ICONS_CONFIG[key];
            if (!config || typeof config.category !== 'string') continue;
            const category = config.category || 'Uncategorized';
            if (!productsByCategory[category]) productsByCategory[category] = [];
            productsByCategory[category].push({ key, ...config });
        }

        let outerHTML = '<div class="space-y-4">';
        let hasContent = false;

        CATEGORY_DISPLAY_ORDER.forEach(categoryName => {
            if (productsByCategory[categoryName]?.length > 0) {
                const productsInThisCategory = productsByCategory[categoryName];
                let categorySectionHTML = `<div class="category-section">
                                             <h4 class="text-sm font-semibold text-gray-700 mb-1.5 border-b border-gray-200 pb-1">${escapeHTML(categoryName)}</h4>
                                             <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-2 gap-y-2">`;
                let iconsHTML_forThisCategory = "";
                let iconsAddedToCategory = 0;

                productsInThisCategory.forEach(prodConfig => {
                    if (!prodConfig?.csvHeader || !prodConfig?.name) return;
                    const productPropertyKey = prodConfig.csvHeader;
                    let iconFileToUse = prodConfig.icon_unavailable;
                    let itemClasses = "product-icon-item flex flex-col items-center text-center p-1 opacity-50";
                    let altText = `${escapeHTML(prodConfig.name)} (not available)`;

                    if (shop[productPropertyKey] === true) {
                        iconFileToUse = prodConfig.icon_available;
                        itemClasses = "product-icon-item flex flex-col items-center text-center p-1 rounded-md hover:bg-gray-100 transition-colors";
                        altText = escapeHTML(prodConfig.name);
                        iconsAddedToCategory++;
                    }

                    if (!iconFileToUse) iconFileToUse = 'placeholder_icon.png';

                    iconsHTML_forThisCategory += `<div class="${itemClasses}" title="${altText}">
                                                    <img src="/images/icons/${iconFileToUse}" alt="${altText}"
                                                         class="w-10 h-10 sm:w-12 sm:h-12 object-contain mb-0.5"
                                                         onerror="this.style.display='none';">
                                                    <span class="text-[0.7rem] sm:text-xs font-medium text-gray-600 leading-tight">${escapeHTML(prodConfig.name)}</span>
                                                  </div>`;
                });
                categorySectionHTML += iconsHTML_forThisCategory + `</div></div>`;

                if (iconsAddedToCategory > 0) {
                    outerHTML += categorySectionHTML;
                    hasContent = true;
                }
            }
        });

        if (!hasContent) return '<p class="text-sm text-gray-500 text-center p-2">No specific products listed as available.</p>';
        outerHTML += '</div>';
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
function displayOpeningHours(placeDetails, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = '';

    const overallStatusContainer = document.createElement('div');
    overallStatusContainer.className = 'text-center mb-3 text-sm';
    let isOpenNowText = '';
    let isOpenNowClass = 'text-gray-600';

    if (placeDetails?.opening_hours) {
        if (typeof placeDetails.opening_hours.isOpen === 'function') { // JS Lib
            const isOpen = placeDetails.opening_hours.isOpen();
            if (isOpen !== undefined) {
                isOpenNowText = isOpen ? 'Open Now' : 'Closed Now';
                isOpenNowClass = isOpen ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
            }
        } else if (placeDetails.business_status === "OPERATIONAL" && typeof placeDetails.opening_hours.open_now === 'boolean') { // API JSON
            isOpenNowText = placeDetails.opening_hours.open_now ? 'Open Now' : 'Closed Now';
            isOpenNowClass = placeDetails.opening_hours.open_now ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
        }
        if (isOpenNowText) {
            overallStatusContainer.innerHTML = `<p class="${isOpenNowClass}">${isOpenNowText}</p>`;
            containerElement.appendChild(overallStatusContainer);
        }
    }

    if (placeDetails?.opening_hours?.weekday_text?.length === 7) {
        const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDayIndex = new Date().getDay();
        const googleHoursMap = new Map();
        placeDetails.opening_hours.weekday_text.forEach(text => {
            const parts = text.split(/:\s*(.*)/s);
            if (parts.length >= 2) googleHoursMap.set(parts[0].trim(), parts[1].trim() || 'Closed');
        });

        const hoursGrid = document.createElement('div');
        hoursGrid.className = 'grid grid-cols-7 gap-px border border-gray-300 rounded-md overflow-hidden text-xs sm:text-sm bg-gray-300 shadow';

        daysOrder.forEach((dayFullName, index) => {
            const dayCell = document.createElement('div');
            const isToday = index === todayDayIndex;
            dayCell.className = `day-cell bg-white p-1.5 sm:p-2 text-center min-h-[60px] flex flex-col justify-start items-center ${isToday ? 'bg-blue-50 border-blue-400 border-2 -m-px relative z-10' : 'border-transparent'}`;
            const dayNameElement = document.createElement('div');
            dayNameElement.className = `day-name font-semibold ${isToday ? 'text-blue-700' : 'text-gray-500'} mb-0.5 sm:mb-1 uppercase text-[0.7rem] sm:text-xs`;
            dayNameElement.textContent = dayFullName.substring(0, 3);
            const hoursElement = document.createElement('div');
            hoursElement.className = `day-hours ${isToday ? 'text-blue-600 font-medium' : 'text-gray-700'} leading-tight`;
            let hoursText = googleHoursMap.get(dayFullName) || 'Not Available';
            if (hoursText.toLowerCase().includes('closed')) hoursElement.classList.add('text-red-500');
            const hoursOnlyMatch = hoursText.match(/^(?:[^:]+:\s*)?(.*)$/);
            hoursElement.textContent = hoursOnlyMatch ? (hoursOnlyMatch[1] || hoursText) : hoursText;
            dayCell.appendChild(dayNameElement);
            dayCell.appendChild(hoursElement);
            hoursGrid.appendChild(dayCell);
        });
        containerElement.appendChild(hoursGrid);

    } else if (placeDetails?.business_status && placeDetails.business_status !== "OPERATIONAL") {
        let statusMessage = "Hours information is not currently available.";
        if (placeDetails.business_status === "CLOSED_TEMPORARILY") statusMessage = "Temporarily Closed";
        else if (placeDetails.business_status === "CLOSED_PERMANENTLY") statusMessage = "Permanently Closed";
        overallStatusContainer.innerHTML = `<p class="text-red-500 font-semibold">${escapeHTML(statusMessage)}</p>`;
        if (!overallStatusContainer.parentElement) containerElement.appendChild(overallStatusContainer);
    } else {
        const defaultMessage = '<p class="text-sm text-gray-500 text-center p-2">Weekly hours information not available.</p>';
        containerElement.innerHTML += defaultMessage;
    }
}