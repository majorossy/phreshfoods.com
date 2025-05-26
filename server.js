// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // For making HTTP requests from the server
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;

app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// --- Helper function to parse CSV (can be moved to a utils_server.js if preferred) ---
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

// --- API Endpoints ---

// Endpoint to provide non-sensitive client-side configurations
app.get('/api/config', (req, res) => {
    res.json({
        // Add any non-sensitive config needed by the client
        // e.g., default map center, zoom levels, etc.
        // For now, we'll let client config.js handle these as they are not secret
        // This endpoint is a placeholder if you need to centralize more config later
    });
});

// Geocode an address (server-side)
async function geocodeAddressOnServer(address) {
    if (!address) return null;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
            return {
                lat: data.results[0].geometry.location.lat,
                lng: data.results[0].geometry.location.lng,
                viewport: data.results[0].geometry.viewport // Include viewport
            };
        } else {
            console.warn(`Server geocoding failed for "${address}": ${data.status}`, data.error_message || '');
            return null;
        }
    } catch (error) {
        console.error(`Server geocoding error for "${address}":`, error);
        return null;
    }
}

// Get Place Details (server-side)
// In server.js
async function getPlaceDetailsOnServer(placeId, fields = 'geometry') {
    console.log(`[Server] getPlaceDetailsOnServer called. Place ID: ${placeId}, Fields: ${fields}`); // Log inputs
    if (!placeId) return null;

    // Temporarily log your API key to ensure it's loaded correctly (REMOVE THIS AFTER DEBUGGING if you share logs)
    // console.log(`[Server] Using GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY ? GOOGLE_MAPS_API_KEY.substring(0, 5) + "..." : "NOT SET"}`);

    const url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${encodeURIComponent(placeId)}&fields=${encodeURIComponent(fields)}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log(`[Server] Fetching Place Details from URL: ${url}`); // Log URL (Be careful if sharing this log with the key visible)

    try {
        const response = await fetch(url);
        const responseText = await response.text(); // Get raw text response
        console.log(`[Server] Place Details API Response Status: ${response.status}`);
        console.log(`[Server] Place Details API Response Text: ${responseText}`); // <<< THIS IS THE MOST IMPORTANT LOG

        const data = JSON.parse(responseText); // Then parse it

        if (data.status === 'OK' && data.result) {
            console.log("[Server] Place Details successfully fetched.");
            return data.result;
        } else {
            // Log the full data object as well if the status isn't OK
            console.warn(`[Server] Place Details failed for ID "${placeId}": ${data.status}`, data.error_message || '', data);
            return null;
        }
    } catch (error) {
        // This catch is for errors during the fetch itself or JSON.parse, not API logical errors like "INVALID_KEY"
        console.error(`[Server] Place Details CAUGHT EXCEPTION for ID "${placeId}":`, error);
        return null;
    }
}


// Cache for farm stands data
let farmStandsCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Endpoint to get farm stands data (fetched, parsed, and geocoded by server)
app.get('/api/farm-stands', async (req, res) => {
    if (farmStandsCache && (Date.now() - lastCacheTime < CACHE_DURATION)) {
        console.log('Serving farm stands from cache.');
        return res.json(farmStandsCache);
    }

    console.log('Fetching fresh farm stands data.');
    try {
        const PROXY_URL = "https://api.allorigins.win/raw?url="; // Optional proxy
        const DATA_FETCH_URL = PROXY_URL + encodeURIComponent(GOOGLE_SHEET_URL);
        
        const response = await fetch(DATA_FETCH_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
        }
        const csvText = await response.text();
        if (!csvText || csvText.trim() === "") {
            return res.status(500).json({ error: "No data received from source." });
        }

        // --- Parsing logic from your apiService.js ---
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return res.status(500).json({ error: "CSV data has insufficient lines." });
        
        const headerLine = lines.shift();
        const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
        const headerMap = {
            name: headers.indexOf("name"), address: headers.indexOf("address"), city: headers.indexOf("city"),
            zip: headers.indexOf("zip"), rating: headers.indexOf("rating"), phone: headers.indexOf("phone"),
            website: headers.indexOf("website"), googleprofileid: headers.indexOf("place id"),
            logo: headers.indexOf("logo"), imageone: headers.indexOf("image_one"), imagetwo: headers.indexOf("image_two"),
            imagethree: headers.indexOf("image_three"), twitterhandle: headers.indexOf("twitter"),
            facebookpageid: headers.indexOf("facebook"), instagramusername: headers.indexOf("instagram username"),
            instagramembedcode: headers.indexOf("instagram embed code"), instagramlink: headers.indexOf("instagram"),
            beef: headers.indexOf("beef"), pork: headers.indexOf("pork"), lamb: headers.indexOf("lamb"),
            chicken: headers.indexOf("chicken"), turkey: headers.indexOf("turkey"), duck: headers.indexOf("duck"),
            eggs: headers.indexOf("eggs"), corn: headers.indexOf("corn"), carrots: headers.indexOf("carrots"),
            garlic: headers.indexOf("garlic"), onions: headers.indexOf("onions"), potatoes: headers.indexOf("potatoes"),
            lettus: headers.indexOf("lettus"), spinach: headers.indexOf("spinach"), squash: headers.indexOf("squash"),
            tomatoes: headers.indexOf("tomatoes"), peppers: headers.indexOf("peppers"), cucumbers: headers.indexOf("cucumbers"),
            zucchini: headers.indexOf("zucchini"), strawberries: headers.indexOf("strawberries"), blueberries: headers.indexOf("blueberries"),
            slugUrl: headers.indexOf("url"),
        };

        // Check if 'slugUrl' header was found
        if (headerMap.slugUrl === -1) {
            console.warn("WARNING: CSV column for 'url' (for slugs) not found in headers. Shops may not have slugs.");
        }

        let shops = lines.map((line, lineIndex) => {
            if (!line.trim()) return null;
            const rawValues = parseCSVLine(line);
            const getStringValue = (key) => {
                const index = headerMap[key];
                return (index === -1 || index === undefined || index >= rawValues.length) ? "" : (rawValues[index] || "");
            };
            const getProductBoolean = (key) => {
                const val = getStringValue(key).trim().toLowerCase();
                return ['true', '1', 'yes', 't', 'x', 'available'].includes(val);
            };
            const encodedEmbed = getStringValue("instagramembedcode");
            let decodedEmbed = '';
            if (encodedEmbed) { try { decodedEmbed = Buffer.from(encodedEmbed, 'base64').toString('utf-8'); } catch (e) { decodedEmbed = "<!-- Invalid Embed -->"; } }
            const shop = {
                Name: getStringValue("name") || "Farm Stand (Name Missing)", Address: getStringValue("address") || "N/A",
                City: getStringValue("city") || "N/A", Zip: getStringValue("zip") || "N/A", Rating: getStringValue("rating") || "N/A",
                Phone: getStringValue("phone"), Website: getStringValue("website"), GoogleProfileID: getStringValue("googleprofileid"),
                slug: getStringValue("slugUrl").trim(),
                TwitterHandle: getStringValue("twitterhandle"), FacebookPageID: getStringValue("facebookpageid"),
                InstagramUsername: getStringValue("instagramusername"), InstagramRecentPostEmbedCode: decodedEmbed, InstagramLink: getStringValue("instagramlink"),
                ImageOne: getStringValue("imageone"), ImageTwo: getStringValue("imagetwo"), ImageThree: getStringValue("imagethree"),
                beef: getProductBoolean("beef"), pork: getProductBoolean("pork"), lamb: getProductBoolean("lamb"),
                chicken: getProductBoolean("chicken"), turkey: getProductBoolean("turkey"), duck: getProductBoolean("duck"),
                eggs: getProductBoolean("eggs"), corn: getProductBoolean("corn"), carrots: getProductBoolean("carrots"),
                garlic: getProductBoolean("garlic"), onions: getProductBoolean("onions"), potatoes: getProductBoolean("potatoes"),
                lettus: getProductBoolean("lettus"), spinach: getProductBoolean("spinach"), squash: getProductBoolean("squash"),
                tomatoes: getProductBoolean("tomatoes"), peppers: getProductBoolean("peppers"), cucumbers: getProductBoolean("cucumbers"),
                zucchini: getProductBoolean("zucchini"), strawberries: getProductBoolean("strawberries"), blueberries: getProductBoolean("blueberries"),
                lat: null, lng: null, distance: null, placeDetails: null, // These will be populated
            };
            if ((shop.City === "N/A" || !shop.City.trim()) && shop.Address && shop.Address !== "N/A") { /* ... city parsing ... */ }
            if ((shop.Zip === "N/A" || !shop.Zip.trim()) && shop.Address && shop.Address !== "N/A") { /* ... zip parsing ... */ }
            return shop;
        }).filter(shop => shop && shop.Name && shop.Name.trim() !== "" && shop.Name !== "N/A" && shop.Name !== "Farm Stand (Name Missing)");

        // Geocode shops
        for (let shop of shops) {
            if (shop.GoogleProfileID) {
                const details = await getPlaceDetailsOnServer(shop.GoogleProfileID, 'geometry');
                if (details && details.geometry && details.geometry.location) {
                    shop.lat = details.geometry.location.lat;
                    shop.lng = details.geometry.location.lng;
                }
            }
            // Fallback to address geocoding if no Place ID or Place ID geocoding failed
            if ((!shop.lat || !shop.lng) && shop.Address && shop.Address !== "N/A") {
                const location = await geocodeAddressOnServer(shop.Address + (shop.City && shop.City !== "N/A" ? ", " + shop.City : "") + ", Maine");
                if (location) {
                    shop.lat = location.lat;
                    shop.lng = location.lng;
                }
            }
        }
        
        farmStandsCache = shops.filter(shop => shop.lat && shop.lng); // Only cache successfully geocoded shops
        lastCacheTime = Date.now();
        console.log(`Successfully fetched and processed ${farmStandsCache.length} farm stands.`);
        res.json(farmStandsCache);

    } catch (error) {
        console.error("Error fetching or processing farm stands:", error);c
        res.status(500).json({ error: "Failed to load farm stand data." });
    }
});

// Proxy for Google Geocoding API
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

// Proxy for Google Place Details API
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

// Proxy for Google Directions API
app.get('/api/directions', async (req, res) => {
    const { origin, destination } = req.query;
    if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination query parameters are required' });
    }
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Directions API proxy error:", error);
        res.status(500).json({ error: 'Failed to get directions' });
    }
});










// server.js

// Place this AFTER app.use(express.static(...)) and AFTER all your /api/... routes.
// It should be the LAST app.get() or app.use() that handles general requests.

app.get('*', (req, res, next) => { // Using '*' is fine here
    // If the request is for an API endpoint, skip serving index.html
    // Let specific API routes handle it, or it will 404 if no API route matches.
    if (req.path.startsWith('/api/')) {
        console.log(`Catch-all: Path starts with /api (${req.path}), calling next().`);
        return next();
    }

    // If the path looks like it has a file extension (e.g., .js, .css, .png, .ico)
    // it means express.static should have served it. If it reaches here,
    // the static file was not found by express.static. So, we let it fall through
    // to Express's default 404 handling for missing static assets by calling next().
    if (path.extname(req.path)) { // path.extname returns '.js', '.css', etc. or ''
        console.log(`Catch-all: Path has extension (${req.path}), calling next() to let express.static 404 if not found.`);
        return next();
    }

    // For any other GET request, assume it's an SPA route and serve index.html
    // This typically covers paths like '/', '/farm/some-slug', '/about', etc.
    console.log(`Catch-all: Serving index.html for SPA path: ${req.path}`);
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            console.error('Error sending index.html:', err.message); // Log only the message
            if (!res.headersSent) {
                res.status(500).send('Error serving application base page.');
            }
        }
    });
});

// If you want a final 404 handler for anything that fell through everything else
// (e.g., POST requests to non-API paths, or API paths not defined)
// This should be the very last app.use()
app.use((req, res, next) => {
    console.log(`Final 404 handler reached for ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
        res.status(404).send("Sorry, can't find that!");
    }
});






app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn('WARNING: GOOGLE_MAPS_API_KEY is not set in .env file. Google Maps features may not work.');
    }
     if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL === "YOUR_GOOGLE_SHEET_PUBLISHED_CSV_URL_HERE") {
        console.warn('WARNING: GOOGLE_SHEET_URL is not set correctly in .env file. Farm stand data fetching will fail.');
    }
});


