'use strict';

const DEBUG_UTILS_JS = false; // <-- !! ADDED DEBUG FLAG !!

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] getDistanceFromLatLonInKm called with: lat1=${lat1}, lon1=${lon1}, lat2=${lat2}, lon2=${lon2}`);
    }
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] getDistanceFromLatLonInKm: dLat (radians)=${dLat}, dLon (radians)=${dLon}`);
    }
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] getDistanceFromLatLonInKm: a=${a}, c=${c}, distance (km)=${distance}`);
    }
    return distance;
}

function deg2rad(deg) {
    // This function is small, extensive logging might be overkill unless specifically debugging it.
    // A simple entry/exit log should suffice.
    if (DEBUG_UTILS_JS) {
        // console.log(`[utils.js_DEBUG] deg2rad called with: deg=${deg}`);
    }
    const radians = deg * (Math.PI / 180);
    if (DEBUG_UTILS_JS) {
        // console.log(`[utils.js_DEBUG] deg2rad: returning radians=${radians}`);
    }
    return radians;
}

function kmToMiles(km) {
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] kmToMiles called with: km=${km}`);
    }
    const miles = km * 0.621371;
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] kmToMiles: returning miles=${miles}`);
    }
    return miles;
}

/**
 * Parses a single line of a CSV string.
 * Note: This is primarily for server-side use now. Kept here in case of any client-side CSV parsing needs.
 * @param {string} line - The CSV line to parse.
 * @returns {string[]} An array of string values from the parsed line.
 */
function parseCSVLine(line) {
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] parseCSVLine called with line: "${line}"`);
    }
    const values = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (DEBUG_UTILS_JS) {
            // This can be very verbose, enable if deep debugging CSV parsing.
            // console.log(`[utils.js_DEBUG] parseCSVLine: char='${char}', inQuotes=${inQuotes}, currentVal='${currentVal}'`);
        }

        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                currentVal += '"';
                i++; // Skip the next quote
                if (DEBUG_UTILS_JS) {
                    // console.log(`[utils.js_DEBUG] parseCSVLine: Handled escaped quote. currentVal='${currentVal}'`);
                }
            } else {
                inQuotes = !inQuotes;
                if (DEBUG_UTILS_JS) {
                    // console.log(`[utils.js_DEBUG] parseCSVLine: Toggled inQuotes to ${inQuotes}`);
                }
            }
        } else if (char === ',' && !inQuotes) {
            const trimmedVal = currentVal.trim();
            values.push(trimmedVal);
            if (DEBUG_UTILS_JS) {
                console.log(`[utils.js_DEBUG] parseCSVLine: Pushed value: '${trimmedVal}'`);
            }
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    const lastTrimmedVal = currentVal.trim();
    values.push(lastTrimmedVal); // Trim the last value
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] parseCSVLine: Pushed last value: '${lastTrimmedVal}'`);
        console.log(`[utils.js_DEBUG] parseCSVLine: Returning values:`, values);
    }
    return values;
}

/**
 * Converts a string into a URL-friendly slug.
 * Primarily, slugs are generated server-side and included in the shop data.
 * This client-side version can be used for display purposes or if client-side slug generation is ever needed.
 * @param {string} text - The text to slugify.
 * @returns {string} The slugified text.
 */
function slugify(text) {
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] slugify called with text: "${text}"`);
    }
    if (!text) {
        if (DEBUG_UTILS_JS) {
            console.log(`[utils.js_DEBUG] slugify: text is empty or null, returning empty string.`);
        }
        return '';
    }

    let slug = text.toString();
    if (DEBUG_UTILS_JS) console.log(`[utils.js_DEBUG] slugify step 0 (toString): "${slug}"`);

    slug = slug.toLowerCase();
    if (DEBUG_UTILS_JS) console.log(`[utils.js_DEBUG] slugify step 1 (toLowerCase): "${slug}"`);

    slug = slug.trim();
    if (DEBUG_UTILS_JS) console.log(`[utils.js_DEBUG] slugify step 2 (trim): "${slug}"`);

    slug = slug.replace(/\s+/g, '-'); // Replace spaces with -
    if (DEBUG_UTILS_JS) console.log(`[utils.js_DEBUG] slugify step 3 (replace spaces): "${slug}"`);

    slug = slug.replace(/[^\w-]+/g, ''); // Remove all non-word chars (except hyphen and word characters)
    if (DEBUG_UTILS_JS) console.log(`[utils.js_DEBUG] slugify step 4 (remove non-word chars): "${slug}"`);

    slug = slug.replace(/--+/g, '-'); // Replace multiple hyphens with a single hyphen
    if (DEBUG_UTILS_JS) console.log(`[utils.js_DEBUG] slugify step 5 (replace multiple hyphens): "${slug}"`);

    slug = slug.replace(/^-+/, ''); // Trim hyphens from start of text
    if (DEBUG_UTILS_JS) console.log(`[utils.js_DEBUG] slugify step 6 (trim start hyphens): "${slug}"`);

    slug = slug.replace(/-+$/, ''); // Trim hyphens from end of text
    if (DEBUG_UTILS_JS) console.log(`[utils.js_DEBUG] slugify step 7 (trim end hyphens): "${slug}"`);

    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] slugify: Returning slug: "${slug}"`);
    }
    return slug;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHTML(str) {
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] escapeHTML called with str: "${str}" (type: ${typeof str})`);
    }
    if (typeof str !== 'string') {
        if (DEBUG_UTILS_JS) {
            console.log(`[utils.js_DEBUG] escapeHTML: input is not a string, returning empty string.`);
        }
        return ''; // Return empty string if not a string
    }
    const escapedStr = str.replace(/[&<>"']/g, function (match) {
        const replacement = {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '&#39;'
        }[match];
        if (DEBUG_UTILS_JS) {
            // console.log(`[utils.js_DEBUG] escapeHTML: replacing '${match}' with '${replacement}'`);
        }
        return replacement;
    });
    if (DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] escapeHTML: Returning escaped string: "${escapedStr}"`);
    }
    return escapedStr;
}






// utils.js (or at the top of main.js if not already in utils.js)

/**
 * Sets a cookie.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {number} [days] - Optional number of days until the cookie expires.
 */
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax"; // Added SameSite
    if (typeof DEBUG_UTILS_JS !== 'undefined' && DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] Cookie set: ${name}=${value}, expires in ${days} days`);
    } else if (typeof DEBUG_MAIN_JS !== 'undefined' && DEBUG_MAIN_JS) { // Fallback if in main.js
        console.log(`[main.js_DEBUG] Cookie set: ${name}=${value}, expires in ${days} days`);
    }
}

/**
 * Gets a cookie by name.
 * @param {string} name - The name of the cookie.
 * @returns {string|null} The cookie value or null if not found.
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            const value = c.substring(nameEQ.length, c.length);
            if (typeof DEBUG_UTILS_JS !== 'undefined' && DEBUG_UTILS_JS) {
                console.log(`[utils.js_DEBUG] Cookie get: ${name}=${value}`);
            } else if (typeof DEBUG_MAIN_JS !== 'undefined' && DEBUG_MAIN_JS) {
                 console.log(`[main.js_DEBUG] Cookie get: ${name}=${value}`);
            }
            return value;
        }
    }
    if (typeof DEBUG_UTILS_JS !== 'undefined' && DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] Cookie get: ${name} not found`);
    } else if (typeof DEBUG_MAIN_JS !== 'undefined' && DEBUG_MAIN_JS) {
        console.log(`[main.js_DEBUG] Cookie get: ${name} not found`);
    }
    return null;
}

/**
 * Erases a cookie by name.
 * @param {string} name - The name of the cookie to erase.
 */
function eraseCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    if (typeof DEBUG_UTILS_JS !== 'undefined' && DEBUG_UTILS_JS) {
        console.log(`[utils.js_DEBUG] Cookie erased: ${name}`);
    } else if (typeof DEBUG_MAIN_JS !== 'undefined' && DEBUG_MAIN_JS) {
        console.log(`[main.js_DEBUG] Cookie erased: ${name}`);
    }
}
