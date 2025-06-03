// public/js/apiService.js
'use strict';
const DEBUG_API = false;

function apiDebugLog(...args) {
    if (DEBUG_API) console.log('[api-DEBUG]', ...args);
}
function apiDebugWarn(...args) {
    if (DEBUG_API) console.warn('[api-WARN]', ...args);
}
function apiDebugError(...args) {
    if (DEBUG_API) console.error('[api-ERROR]', ...args);
}

/**
 * Fetches and processes farm stand data from the server backend.
 * The server handles fetching from the Google Sheet, parsing, and initial geocoding.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of shop objects.
 */
async function fetchAndProcessFarmStands() {
    const dom = window.AppState?.dom; // For displaying error messages if needed

    try {
        const response = await fetch('/api/farm-stands'); // Fetch from your Node.js backend
        if (!response.ok) {
            // Try to parse error from server, otherwise use a generic message
            const errorData = await response.json().catch(() => ({ 
                error: `Server responded with status: ${response.status}` 
            }));
            console.error(`apiService.js: HTTP error fetching farm stands! Status: ${response.status}`, errorData.error);
            throw new Error(errorData.error || `Failed to fetch farm stands. Status: ${response.status}`);
        }
        const shops = await response.json();

        if (!shops) { // Check if shops is null or undefined (though .json() usually throws or returns object)
            console.warn("apiService.js: No farm stands data received from the server (response was ok, but data is null/undefined).");
            if (dom?.noResultsDiv) {
                dom.noResultsDiv.textContent = "Farm stand data is currently unavailable. Please try again later.";
                dom.noResultsDiv.classList.remove('hidden');
                if (dom.listingsContainer) dom.listingsContainer.classList.add('hidden');
            }
            return [];
        }
        
        if (shops.length === 0) {
             console.warn("apiService.js: Zero farm stands received from the server.");
            // Potentially display a message if appropriate, or let main.js handle "no results" for filters
        }


        // apiService.js or wherever shops are processed
        // Example processing for each shop:
        shops.lat = parseFloat(shop.lat_from_sheet);
        shops.lng = parseFloat(shop.lng_from_sheet);
        if (isNaN(shops.lat) || isNaN(shops.lng)) {
            console.warn(`Invalid coordinates for shop ${shops.Name}: lat=${shops.lat_from_sheet}, lng=${shops.lng_from_sheet}. Setting to null.`);
            shops.lat = null;
            shops.lng = null;
        }

        // Data is already parsed, geocoded, and includes slugs from the server.
        // Client-side specific initializations:
        return shops.map(shop => ({
            ...shop,
            // Ensure these client-side specific properties are initialized if not sent by server
            // (though server should send all necessary data fields, these are for client state)
            placeDetails: shops.placeDetails || null, // For caching Google Place Details fetched on client
            marker: null,                            // Google Maps marker object, created by mapLogic.js
            _isFetchingCardDetails: false,           // Internal flag for UI logic
        }));

    } catch (error) {
        console.error("apiService.js: Could not fetch or process farm stand data from server.", error.message);
        if (dom?.noResultsDiv) {
            // Use a more user-friendly message
            dom.noResultsDiv.textContent = "Could not load farm stand data. Please check your connection and try again. If the problem persists, the service might be temporarily down.";
            dom.noResultsDiv.classList.remove('hidden');
            if (dom.listingsContainer) dom.listingsContainer.classList.add('hidden');
        }
        return []; // Return empty array on critical failure
    }
}

/**
 * Fetches geocoded location data from the backend API.
 * @param {string} address - The address string to geocode.
 * @returns {Promise<Object|null>} A promise that resolves to a location object { lat, lng, viewport } or null on failure.
 */
async function geocodeAddressClient(address) {
    if (!address || typeof address !== 'string' || address.trim() === "") {
        console.warn("geocodeAddressClient: Invalid or empty address provided.");
        return null;
    }
    try {
        const response = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Geocoding request failed" }));
            throw new Error(errorData.error || `Geocoding request failed: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error geocoding address on client (via backend):", error.message);
        return null;
    }
}

/**
 * Fetches Google Place Details from the backend API.
 * @param {string} placeId - The Google Place ID.
 * @param {string} [fields] - Optional comma-separated string of fields to request.
 * @returns {Promise<Object|null>} A promise that resolves to the place details object or null on failure.
 */
async function getPlaceDetailsClient(placeId, fields) {
    if (!placeId) {
        console.warn("getPlaceDetailsClient: No Place ID provided.");
        return null;
    }
    try {
        const fieldQuery = fields ? `&fields=${encodeURIComponent(fields)}` : '';
        const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}${fieldQuery}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Fetching place details failed" }));
            throw new Error(errorData.error || `Place details request failed: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching place details on client (via backend):", error.message);
        return null;
    }
}

/**
 * Fetches driving directions from the backend API.
 * @param {string} origin - The starting point (address or lat,lng).
 * @param {string} destination - The ending point (address, lat,lng, or place_id:).
 * @returns {Promise<Object|null>} A promise that resolves to the Google Directions result object or null on failure.
 */
async function getDirectionsClient(origin, destination) {
    if (!origin || !destination) {
        console.warn("getDirectionsClient: Origin or destination missing.");
        return null;
    }
    try {
        const response = await fetch(`/api/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Fetching directions failed" }));
            throw new Error(errorData.error || `Directions request failed: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching directions on client (via backend):", error.message);
        return null;
    }
}