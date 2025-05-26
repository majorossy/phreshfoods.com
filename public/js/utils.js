'use strict';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function kmToMiles(km) {
    return km * 0.621371;
}

/**
 * Parses a single line of a CSV string.
 * Note: This is primarily for server-side use now. Kept here in case of any client-side CSV parsing needs.
 * @param {string} line - The CSV line to parse.
 * @returns {string[]} An array of string values from the parsed line.
 */
function parseCSVLine(line) {
    const values = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                currentVal += '"';
                i++; 
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(currentVal.trim()); // Trim individual values as they are parsed
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    values.push(currentVal.trim()); // Trim the last value
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
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w-]+/g, '')       // Remove all non-word chars (except hyphen and word characters)
        .replace(/--+/g, '-')         // Replace multiple hyphens with a single hyphen
        .replace(/^-+/, '')             // Trim hyphens from start of text
        .replace(/-+$/, '');            // Trim hyphens from end of text
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return ''; // Return empty string if not a string
    return str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '&#39;'
        }[match];
    });
}