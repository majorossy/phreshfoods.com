// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs-extra'); // For reading/writing JSON file
const path = require('path');
const cron = require('node-cron'); // For scheduling
const { Client, Status } = require("@googlemaps/google-maps-services-js");
const cacheService = require('./cacheService'); // For on-demand API call caching
const { updateFarmStandsData } = require('./processSheetData'); // Import the processor

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; // Still needed for on-demand calls
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL; // Used by processSheetData.js
const FARM_STANDS_DATA_PATH = path.join(__dirname, 'data', 'farmStandsData.json');

const googleMapsClient = new Client({}); // Initialize the client for on-demand calls

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Helper function to parse CSV (Only if not also defined in processSheetData.js, or ensure consistency) ---
// If processSheetData.js has its own, you might not need it here unless other parts of server.js use it.
// For simplicity, I'll assume it's potentially needed here too or keep it for clarity.
function parseCSVLine(line) {
    const values = [];
    let currentVal = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                currentVal += '"'; i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(currentVal.trim()); currentVal = '';
        } else {
            currentVal += char;
        }
    }
    values.push(currentVal.trim());
    return values;
}


// --- On-demand Geocoding and Place Details (for client direct requests) ---
async function geocodeAddressOnServer(address) {
    if (!address) return null;
    const cacheKey = cacheService.getCacheKey(cacheService.CACHE_PREFIXES.GEOCODE, address);
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) return cachedResult;

    console.log(`[Server On-Demand API Call - Geocode] Geocoding address: ${address}`);
    try {
        const response = await googleMapsClient.geocode({
            params: {
                address: address,
                key: GOOGLE_MAPS_API_KEY,
                components: { country: 'US', administrative_area: 'ME' }
            },
            timeout: 5000,
        });

        if (response.data.status === Status.OK && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            const result = {
                lat: location.lat,
                lng: location.lng,
                viewport: response.data.results[0].geometry.viewport,
                formatted_address: response.data.results[0].formatted_address,
                place_id: response.data.results[0].place_id
            };
            cacheService.set(cacheKey, result, 86400); // Cache for 24 hours
            return result;
        } else {
            console.warn(`[Server On-Demand] Geocoding failed for "${address}": ${response.data.status}`, response.data.error_message || '');
            return null;
        }
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[Server On-Demand] Geocoding error for "${address}":`, errorMessage);
        return null;
    }
}

async function getPlaceDetailsOnServer(placeId, fieldsString = 'geometry') {
    // console.log(`[Server On-Demand] getPlaceDetailsOnServer called. Place ID: ${placeId}, Fields: ${fieldsString}`); // Can be verbose
    if (!placeId) return null;
    const fieldsArray = typeof fieldsString === 'string' ? fieldsString.split(',').map(f => f.trim()).sort() : ['geometry'];
    const cacheKeyIdentifier = `${placeId}_fields_${fieldsArray.join('-')}`;
    const cacheKey = cacheService.getCacheKey(cacheService.CACHE_PREFIXES.PLACE_DETAILS, cacheKeyIdentifier);
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) return cachedResult;

    console.log(`[Server On-Demand API Call - Place Details] ID: ${placeId}, Fields: ${fieldsArray.join(',')}`);
    try {
        const response = await googleMapsClient.placeDetails({
            params: {
                place_id: placeId,
                fields: fieldsArray,
                key: GOOGLE_MAPS_API_KEY,
            },
            timeout: 5000,
        });
        if (response.data.status === Status.OK && response.data.result) {
            let ttl = 21600; // Default 6 hours
            // If opening_hours were requested, use a shorter TTL for this specific cache entry
            if (fieldsArray.includes('opening_hours')) {
                ttl = 900; // 15 minutes, adjust as needed
                console.log(`[Server On-Demand] Using shorter TTL (${ttl}s) for Place Details with opening_hours.`);
            }
            cacheService.set(cacheKey, response.data.result, ttl);
            return response.data.result;
        } else {
            console.warn(`[Server On-Demand] Place Details failed for ID "${placeId}": ${response.data.status}`, response.data.error_message || '');
            return null;
        }
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[Server On-Demand] Place Details CAUGHT EXCEPTION for ID "${placeId}":`, errorMessage);
        return null;
    }
}

// --- API Endpoints ---

app.get('/api/config', (req, res) => {
    res.json({});
});

// Endpoint to get farm stands data (now reads from JSON file)
app.get('/api/farm-stands', async (req, res) => {
    try {
        if (await fs.pathExists(FARM_STANDS_DATA_PATH)) {
            const farmStands = await fs.readJson(FARM_STANDS_DATA_PATH);
            console.log(`Serving ${farmStands.length} farm stands from JSON file: ${FARM_STANDS_DATA_PATH}`);
            res.json(farmStands);
        } else {
            console.warn(`Farm stands data file not found at ${FARM_STANDS_DATA_PATH}. Attempting to generate it now...`);
            // Trigger an immediate update if file doesn't exist.
            // Client will have to wait or retry if this takes time.
            await updateFarmStandsData();
            if (await fs.pathExists(FARM_STANDS_DATA_PATH)) {
                const farmStands = await fs.readJson(FARM_STANDS_DATA_PATH);
                console.log(`Serving ${farmStands.length} farm stands from newly generated JSON file.`);
                res.json(farmStands);
            } else {
                console.error(`Failed to generate farm stands data file even after an update attempt.`);
                res.status(503).json({ error: "Farm stand data is currently unavailable. Please try again shortly." });
            }
        }
    } catch (error) {
        console.error("Error serving farm stands from JSON:", error);
        res.status(500).json({ error: "Failed to load farm stand data." });
    }
});

// Proxy for on-demand Google Geocoding API calls from client
app.get('/api/geocode', async (req, res) => {
    const address = req.query.address;
    if (!address) {
        return res.status(400).json({ error: 'Address query parameter is required' });
    }
    const location = await geocodeAddressOnServer(address);
    if (location) {
        res.json(location);
    } else {
        res.status(500).json({ error: 'Failed to geocode address' });
    }
});

// Proxy for on-demand Google Place Details API calls from client
app.get('/api/places/details', async (req, res) => {
    const placeId = req.query.placeId;
    const fields = req.query.fields || 'name,formatted_address,website,opening_hours,rating,user_ratings_total,photos,formatted_phone_number,url,icon,business_status,reviews,geometry';
    if (!placeId) {
        return res.status(400).json({ error: 'placeId query parameter is required' });
    }
    const details = await getPlaceDetailsOnServer(placeId, fields);
    if (details) {
        res.json(details);
    } else {
        res.status(500).json({ error: 'Failed to get place details' });
    }
});

// Proxy for on-demand Google Directions API calls from client
app.get('/api/directions', async (req, res) => {
    const { origin, destination } = req.query;
    if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination query parameters are required' });
    }

    const cacheKeyIdentifier = `o=${encodeURIComponent(origin)}_d=${encodeURIComponent(destination)}`; // Ensure key is consistent
    const cacheKey = cacheService.getCacheKey(cacheService.CACHE_PREFIXES.DIRECTIONS, cacheKeyIdentifier);
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
        return res.json(cachedResult);
    }

    console.log(`[Server On-Demand API Call - Directions] From: ${origin}, To: ${destination}`);
    try {
        const response = await googleMapsClient.directions({
            params: {
                origin: origin,
                destination: destination,
                key: GOOGLE_MAPS_API_KEY,
            },
            timeout: 10000,
        });

        if (response.data.status === Status.OK) {
            cacheService.set(cacheKey, response.data, 3600); // Cache directions for 1 hour
            res.json(response.data);
        } else {
            console.warn(`[Server On-Demand] Directions request failed from "${origin}" to "${destination}": ${response.data.status}`, response.data.error_message || '');
            res.status(400).json({ error: `Could not get directions. Status: ${response.data.status}`, details: response.data.error_message });
        }
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("[Server On-Demand] Directions API proxy error:", errorMessage);
        res.status(500).json({ error: 'Failed to get directions', details: error.message });
    }
});

// Route to manually flush the on-demand cache and trigger data refresh
app.get('/api/cache/flush-and-refresh', async (req, res) => { // Renamed for clarity
    if (process.env.NODE_ENV === 'development' || process.env.ALLOW_CACHE_FLUSH === 'true') {
        console.log('Flushing on-demand API cache...');
        cacheService.flush();
        console.log('Triggering farm stand data refresh...');
        try {
            await updateFarmStandsData(); // Wait for it to complete
            res.send('On-demand API cache flushed and farm stand data refresh triggered and completed.');
        } catch (e) {
            res.status(500).send('On-demand API cache flushed, but farm stand data refresh failed.');
        }
    } else {
        res.status(403).send('Forbidden.');
    }
});


// --- Cron Job Scheduling ---
const CRON_SCHEDULE = process.env.DATA_REFRESH_SCHEDULE || '0 */4 * * *'; // Default to every 4 hours
if (cron.validate(CRON_SCHEDULE)) {
    console.log(`Scheduling farm stand data update with cron expression: ${CRON_SCHEDULE}`);
    cron.schedule(CRON_SCHEDULE, () => {
        console.log(`[${new Date().toISOString()}] Running scheduled farm stand data update...`);
        updateFarmStandsData().catch(err => { // Added catch for scheduled job
            console.error(`[${new Date().toISOString()}] Scheduled farm stand data update FAILED:`, err);
        });
    });
} else {
    console.error(`Invalid CRON_SCHEDULE: ${CRON_SCHEDULE}. Scheduled job will not run.`);
}

// Run once on server startup (after a short delay)
// Only run if the data file doesn't exist or is older than our desired cache age
const INITIAL_REFRESH_DELAY_MS = 10000; // 10 seconds
const MAX_DATA_AGE_MS = (parseInt(process.env.MAX_DATA_FILE_AGE_HOURS) || 4) * 60 * 60 * 1000; // Default 4 hours

setTimeout(async () => {
    let needsInitialUpdate = true;
    try {
        if (await fs.pathExists(FARM_STANDS_DATA_PATH)) {
            const stats = await fs.stat(FARM_STANDS_DATA_PATH);
            if ((Date.now() - stats.mtime.getTime()) < MAX_DATA_AGE_MS) {
                needsInitialUpdate = false;
                console.log(`Initial farm stand data file is recent. Skipping immediate update. Next update via cron: ${CRON_SCHEDULE}`);
            } else {
                console.log('Initial farm stand data file is old. Triggering update...');
            }
        } else {
            console.log('Initial farm stand data file not found. Triggering update...');
        }

        if (needsInitialUpdate) {
            await updateFarmStandsData();
        }
    } catch (err) {
        console.error('Error during initial farm stand data check/update:', err);
    }
}, INITIAL_REFRESH_DELAY_MS);


// SPA Fallback Route
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    if (path.extname(req.path)) { // If it looks like a file request
        return next(); // Let express.static handle it or 404 naturally
    }
    // For any other GET request, assume it's an SPA route
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            console.error('Error sending index.html for SPA route:', err.message);
            if (!res.headersSent) {
                res.status(500).send('Error serving application.');
            }
        }
    });
});

// Final 404 handler
app.use((req, res, next) => {
    if (!res.headersSent) {
        res.status(404).send("Sorry, can't find that!");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn('WARNING: GOOGLE_MAPS_API_KEY is not set. Google Maps features may not work.');
    }
    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL === "YOUR_GOOGLE_SHEET_PUBLISHED_CSV_URL_HERE") {
        console.warn('WARNING: GOOGLE_SHEET_URL is not set correctly. Farm stand data fetching will fail.');
    }
});