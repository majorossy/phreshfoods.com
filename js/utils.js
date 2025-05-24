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
 * Parses a single line of a CSV string, handling quoted fields that may contain commas
 * and double quotes used to escape actual quote characters within a field.
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
            // Check for an escaped quote ("") inside a quoted field
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                currentVal += '"'; // Add a single quote to the current value
                i++; // Increment i to skip the second quote of the pair
            } else {
                inQuotes = !inQuotes; // Toggle the inQuotes state
            }
        } else if (char === ',' && !inQuotes) {
            values.push(currentVal);
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    values.push(currentVal); // Add the last value

    // Trim whitespace from each value after parsing
    return values.map(val => val.trim());
}