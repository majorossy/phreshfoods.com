// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs-extra'); // For reading/writing JSON file
const path = require('path');
const cron = require('node-cron'); // For scheduling
const cors = require('cors'); // CORS middleware
const compression = require('compression'); // Response compression
const rateLimit = require('express-rate-limit'); // Rate limiting
const helmet = require('helmet'); // Security headers
const { Client, Status } = require("@googlemaps/google-maps-services-js");
const cacheService = require('./cacheService'); // For on-demand API call caching
const { updateFarmStandsData, updateAllLocationData } = require('./processSheetData'); // Import the processor

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY_BACKEND = process.env.GOOGLE_API_KEY_BACKEND; // Still needed for on-demand calls
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL; // Used by processSheetData.js

// Data file paths for all location types
const LOCATION_DATA_PATHS = {
    farm_stand: path.join(__dirname, 'data', 'farmStandsData.json'),
    cheese_shop: path.join(__dirname, 'data', 'cheeseShopsData.json'),
    fish_monger: path.join(__dirname, 'data', 'fishMongersData.json'),
    butcher: path.join(__dirname, 'data', 'butchersData.json'),
    antique_shop: path.join(__dirname, 'data', 'antiqueShopsData.json')
};

// Backward compatibility
const FARM_STANDS_DATA_PATH = LOCATION_DATA_PATHS.farm_stand;
const CHEESE_SHOPS_DATA_PATH = LOCATION_DATA_PATHS.cheese_shop;

// Product field definitions for each location type
const PRODUCT_FIELDS = {
    farm_stand: ['beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'eggs', 'corn', 'carrots', 'potatoes', 'lettus', 'spinach', 'squash', 'tomatoes', 'peppers', 'cucumbers', 'zucchini', 'garlic', 'onions', 'strawberries', 'blueberries'],
    cheese_shop: ['cheddar', 'brie', 'gouda', 'mozzarella', 'feta', 'blue_cheese', 'parmesan', 'swiss', 'provolone', 'cow_milk', 'goat_milk', 'sheep_milk'],
    fish_monger: ['salmon', 'cod', 'haddock', 'tuna', 'lobster', 'shrimp', 'crab', 'oysters', 'clams', 'mussels', 'scallops', 'halibut'],
    butcher: ['beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'veal', 'sausages', 'bacon', 'ground_meat', 'steaks', 'roasts'],
    antique_shop: ['furniture', 'jewelry', 'art', 'books', 'ceramics', 'glassware', 'silverware', 'textiles', 'collectibles', 'vintage_clothing']
};

const googleMapsClient = new Client({}); // Initialize the client for on-demand calls

// CORS configuration - restrict to specific origins in production
// Security headers with helmet
// Content Security Policy configured for Google Maps
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Google Maps
        "https://maps.googleapis.com",
        "https://maps.gstatic.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Google Maps
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://*.googleapis.com",
        "https://*.gstatic.com",
        "https://*.google.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        "https://*.googleapis.com",
        "https://*.google.com"
      ],
      frameSrc: ["https://www.google.com"],
      workerSrc: ["blob:"]
    }
  },
  crossOriginEmbedderPolicy: false, // Required for Google Maps
  crossOriginResourcePolicy: { policy: "cross-origin" } // Required for Google Maps resources
}));

// CORS configuration - restrict to specific origins in production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware (gzip/brotli) - add before routes
app.use(compression({
  filter: (req, res) => {
    // Don't compress if client explicitly requests no compression
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter default
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed (1=fastest) and compression (9=best)
  threshold: 1024 // Only compress responses larger than 1KB
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit in dev for HMR
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for farm-stands endpoint in development to avoid issues with React Strict Mode
    return process.env.NODE_ENV === 'development' && req.path === '/api/farm-stands';
  }
});

// Apply rate limiting to all /api routes
app.use('/api/', apiLimiter);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Helper Functions ---

// Input sanitization to prevent XSS and injection attacks
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    // Remove dangerous characters while preserving valid address/search input
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove HTML brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
        .substring(0, 500); // Limit length to prevent DoS
}

// Helper function to parse CSV (Only if not also defined in processSheetData.js, or ensure consistency) ---
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
                key: GOOGLE_API_KEY_BACKEND,
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
            cacheService.set(cacheKey, result, 864000); // Cache for 24 hours
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
                key: GOOGLE_API_KEY_BACKEND,
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

// Health check endpoint for monitoring
app.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        checks: {
            farmStandsData: false,
            farmStandsDataAge: null,
            googleMapsAPI: false,
            memoryUsage: process.memoryUsage()
        }
    };

    // Check if farm stands data file exists and is recent
    try {
        const exists = await fs.pathExists(FARM_STANDS_DATA_PATH);
        if (exists) {
            const stats = await fs.stat(FARM_STANDS_DATA_PATH);
            const ageMs = Date.now() - stats.mtime.getTime();
            const ageHours = ageMs / (1000 * 60 * 60);

            health.checks.farmStandsData = ageMs < MAX_DATA_AGE_MS;
            health.checks.farmStandsDataAge = `${ageHours.toFixed(2)} hours`;
        }
    } catch (e) {
        health.checks.farmStandsData = false;
        health.checks.farmStandsDataAge = 'error';
    }

    // Check Google API key is configured
    health.checks.googleMapsAPI = !!GOOGLE_API_KEY_BACKEND;

    // Overall health status
    const isHealthy = health.checks.farmStandsData && health.checks.googleMapsAPI;
    health.status = isHealthy ? 'ok' : 'degraded';

    res.status(isHealthy ? 200 : 503).json(health);
});

// In-memory cache for unified locations data (all location types)
const locationsCache = {
    data: null,
    lastModifiedFarms: null,
    lastModifiedCheese: null,
    lastModifiedFish: null,
    lastModifiedButchers: null,
    lastModifiedAntiques: null,
    etag: null
};

// Track ongoing data updates to prevent duplicate updates and allow waiting
// Use object to prevent race conditions during assignment
const updateTracker = {
    promise: null,
    isUpdating: false
};

// Helper to start or get existing update
async function ensureDataUpdate() {
    // Check if already updating
    if (updateTracker.isUpdating && updateTracker.promise) {
        console.log('[Data Update] Reusing existing update promise');
        return updateTracker.promise;
    }

    // Start new update with proper locking
    updateTracker.isUpdating = true;
    updateTracker.promise = updateAllLocationData().finally(() => {
        updateTracker.isUpdating = false;
        updateTracker.promise = null;
    });

    return updateTracker.promise;
}

// Unified endpoint to get all locations (farm stands + cheese shops) with ETag caching
app.get('/api/locations', async (req, res) => {
    try {
        console.log('[Locations API] Request received');

        // If an update is in progress, wait for it to complete
        if (updateTracker.isUpdating && updateTracker.promise) {
            console.log('[Locations API] Waiting for ongoing data update to complete...');
            try {
                await updateTracker.promise;
            } catch (err) {
                console.error('[Locations API] Ongoing update failed:', err);
            }
        }

        // Check if all data files exist
        const farmStandsExist = await fs.pathExists(FARM_STANDS_DATA_PATH);
        const cheeseShopsExist = await fs.pathExists(CHEESE_SHOPS_DATA_PATH);
        const fishMongersExist = await fs.pathExists(LOCATION_DATA_PATHS.fish_monger);
        const butchersExist = await fs.pathExists(LOCATION_DATA_PATHS.butcher);
        const antiqueShopsExist = await fs.pathExists(LOCATION_DATA_PATHS.antique_shop);

        if (!farmStandsExist) {
            console.warn(`[Locations API] Farm stands data file not found. Generating...`);
            await ensureDataUpdate();

            if (!(await fs.pathExists(FARM_STANDS_DATA_PATH))) {
                console.error(`[Locations API] Failed to generate farm stands data file`);
                return res.status(503).json({
                    error: "Location data is currently unavailable. Please try again shortly."
                });
            }
        }

        // Get file stats for all files for cache validation
        const farmStats = await fs.stat(FARM_STANDS_DATA_PATH);
        const farmModTime = farmStats.mtime.getTime();

        let cheeseModTime = null;
        if (cheeseShopsExist) {
            const cheeseStats = await fs.stat(CHEESE_SHOPS_DATA_PATH);
            cheeseModTime = cheeseStats.mtime.getTime();
        }

        let fishModTime = null;
        if (fishMongersExist) {
            const fishStats = await fs.stat(LOCATION_DATA_PATHS.fish_monger);
            fishModTime = fishStats.mtime.getTime();
        }

        let butchersModTime = null;
        if (butchersExist) {
            const butchersStats = await fs.stat(LOCATION_DATA_PATHS.butcher);
            butchersModTime = butchersStats.mtime.getTime();
        }

        let antiquesModTime = null;
        if (antiqueShopsExist) {
            const antiquesStats = await fs.stat(LOCATION_DATA_PATHS.antique_shop);
            antiquesModTime = antiquesStats.mtime.getTime();
        }

        // Check if browser has current version (ETag validation)
        const clientETag = req.headers['if-none-match'];

        // Check memory cache first
        const cacheValid = locationsCache.lastModifiedFarms === farmModTime &&
                           locationsCache.lastModifiedCheese === cheeseModTime &&
                           locationsCache.lastModifiedFish === fishModTime &&
                           locationsCache.lastModifiedButchers === butchersModTime &&
                           locationsCache.lastModifiedAntiques === antiquesModTime &&
                           locationsCache.data;

        if (cacheValid) {
            console.log('[Locations API] Memory cache HIT');

            // Browser has current version - send 304 Not Modified
            if (clientETag && clientETag === locationsCache.etag) {
                console.log('[Locations API] Client cache valid - 304 Not Modified');
                return res.status(304).end();
            }

            // Send from memory cache with proper headers
            res.set({
                'ETag': locationsCache.etag,
                'Cache-Control': 'public, max-age=3600, must-revalidate',
                'Last-Modified': new Date(Math.max(farmModTime, cheeseModTime || 0)).toUTCString(),
                'X-Cache': 'HIT'
            });
            return res.json(locationsCache.data);
        }

        // Memory cache miss - read from disk and merge
        console.log('[Locations API] Cache MISS - reading from disk');
        const farmStandsRaw = await fs.readJson(FARM_STANDS_DATA_PATH);

        // Farm stand product fields
        const farmProductFields = ['beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'eggs', 'corn', 'carrots', 'potatoes', 'lettus', 'spinach', 'squash', 'tomatoes', 'peppers', 'cucumbers', 'zucchini', 'garlic', 'onions', 'strawberries', 'blueberries'];

        // Add type field and restructure products for farm stands
        const farmStands = farmStandsRaw.map(location => {
            // Check if products are already nested (new format from processSheetData.js)
            let products;
            if (location.products && typeof location.products === 'object') {
                // Products already in nested format
                products = location.products;
            } else {
                // Old format: products at top level
                products = {};
                farmProductFields.forEach(field => {
                    if (location[field] !== undefined) {
                        products[field] = location[field];
                    }
                });
            }

            return {
                ...location,
                type: 'farm_stand',
                products
            };
        });
        console.log(`[Locations API] Loaded ${farmStands.length} farm stands`);
        console.log(`[Locations API] DEBUG: First farm stand type=${farmStands[0]?.type}, has products=${!!farmStands[0]?.products}`);

        let cheeseShops = [];

        if (cheeseShopsExist) {
            try {
                const cheeseShopsRaw = await fs.readJson(CHEESE_SHOPS_DATA_PATH);

                // Cheese shop product fields
                const cheeseProductFields = ['cheddar', 'brie', 'gouda', 'mozzarella', 'feta', 'blue_cheese', 'parmesan', 'swiss', 'provolone', 'cow_milk', 'goat_milk', 'sheep_milk'];

                // Add type field and restructure products for cheese shops
                cheeseShops = cheeseShopsRaw.map(location => {
                    // Check if products are already nested (new format from processSheetData.js)
                    let products;
                    if (location.products && typeof location.products === 'object') {
                        // Products already in nested format
                        products = location.products;
                    } else {
                        // Old format: products at top level
                        products = {};
                        cheeseProductFields.forEach(field => {
                            if (location[field] !== undefined) {
                                products[field] = location[field];
                            }
                        });
                    }

                    return {
                        ...location,
                        type: 'cheese_shop',
                        products
                    };
                });

                console.log(`[Locations API] Loaded ${cheeseShops.length} cheese shops`);
            } catch (err) {
                console.warn('[Locations API] Failed to load cheese shops, continuing with farms only:', err.message);
            }
        } else {
            console.log('[Locations API] Cheese shops data file not found, serving farms only');
        }

        // Load fish mongers
        let fishMongers = [];
        if (fishMongersExist) {
            try {
                const fishMongersRaw = await fs.readJson(LOCATION_DATA_PATHS.fish_monger);
                fishMongers = fishMongersRaw.map(location => {
                    let products;
                    if (location.products && typeof location.products === 'object') {
                        products = location.products;
                    } else {
                        products = {};
                        PRODUCT_FIELDS.fish_monger.forEach(field => {
                            if (location[field] !== undefined) {
                                products[field] = location[field];
                            }
                        });
                    }
                    return {
                        ...location,
                        type: 'fish_monger',
                        products
                    };
                });
                console.log(`[Locations API] Loaded ${fishMongers.length} fish mongers`);
            } catch (err) {
                console.warn('[Locations API] Failed to load fish mongers:', err.message);
            }
        }

        // Load butchers
        let butchers = [];
        if (butchersExist) {
            try {
                const butchersRaw = await fs.readJson(LOCATION_DATA_PATHS.butcher);
                butchers = butchersRaw.map(location => {
                    let products;
                    if (location.products && typeof location.products === 'object') {
                        products = location.products;
                    } else {
                        products = {};
                        PRODUCT_FIELDS.butcher.forEach(field => {
                            if (location[field] !== undefined) {
                                products[field] = location[field];
                            }
                        });
                    }
                    return {
                        ...location,
                        type: 'butcher',
                        products
                    };
                });
                console.log(`[Locations API] Loaded ${butchers.length} butchers`);
            } catch (err) {
                console.warn('[Locations API] Failed to load butchers:', err.message);
            }
        }

        // Load antique shops
        let antiqueShops = [];
        if (antiqueShopsExist) {
            try {
                const antiqueShopsRaw = await fs.readJson(LOCATION_DATA_PATHS.antique_shop);
                antiqueShops = antiqueShopsRaw.map(location => {
                    let products;
                    if (location.products && typeof location.products === 'object') {
                        products = location.products;
                    } else {
                        products = {};
                        PRODUCT_FIELDS.antique_shop.forEach(field => {
                            if (location[field] !== undefined) {
                                products[field] = location[field];
                            }
                        });
                    }
                    return {
                        ...location,
                        type: 'antique_shop',
                        products
                    };
                });
                console.log(`[Locations API] Loaded ${antiqueShops.length} antique shops`);
            } catch (err) {
                console.warn('[Locations API] Failed to load antique shops:', err.message);
            }
        }

        // Merge all arrays
        const mergedLocations = [...farmStands, ...cheeseShops, ...fishMongers, ...butchers, ...antiqueShops];

        // Deduplicate by GoogleProfileID or slug and merge types
        const locationMap = new Map();

        for (const location of mergedLocations) {
            const key = location.GoogleProfileID || location.slug || location.Name;

            if (!locationMap.has(key)) {
                // First occurrence - set types array
                locationMap.set(key, {
                    ...location,
                    types: [location.type]
                });
            } else {
                // Duplicate found - merge the data
                const existing = locationMap.get(key);

                // Add the new type if not already present
                if (!existing.types.includes(location.type)) {
                    existing.types.push(location.type);
                }

                // Merge products from both entries (union of all products)
                if (location.products && existing.products) {
                    existing.products = {
                        ...existing.products,
                        ...location.products
                    };
                }

                // Keep farm_stand data as base (more complete), but preserve cheese-specific data
                if (location.type === 'cheese_shop' && existing.type === 'farm_stand') {
                    // Preserve any cheese-specific fields that might exist
                    existing.products = {
                        ...existing.products,
                        ...location.products
                    };
                }
            }
        }

        // Convert map to array and determine primary type based on product availability
        const allLocations = Array.from(locationMap.values()).map(location => {
            // If location has multiple types, determine primary based on which products it actually has
            if (location.types && location.types.length > 1) {
                // Count products for each type
                const productCounts = {
                    farm_stand: farmProductFields.filter(field =>
                        location.products && location.products[field] === true
                    ).length,
                    cheese_shop: PRODUCT_FIELDS.cheese_shop.filter(field =>
                        location.products && location.products[field] === true
                    ).length,
                    fish_monger: PRODUCT_FIELDS.fish_monger.filter(field =>
                        location.products && location.products[field] === true
                    ).length,
                    butcher: PRODUCT_FIELDS.butcher.filter(field =>
                        location.products && location.products[field] === true
                    ).length,
                    antique_shop: PRODUCT_FIELDS.antique_shop.filter(field =>
                        location.products && location.products[field] === true
                    ).length
                };

                // Find the type with the most products
                let maxCount = 0;
                let primaryType = location.type; // Default to current type

                for (const [type, count] of Object.entries(productCounts)) {
                    if (count > maxCount && location.types.includes(type)) {
                        maxCount = count;
                        primaryType = type;
                    }
                }

                location.type = primaryType;
            }

            return location;
        });

        const duplicatesRemoved = mergedLocations.length - allLocations.length;

        if (duplicatesRemoved > 0) {
            console.log(`[Locations API] Removed ${duplicatesRemoved} duplicate locations`);
        }

        const etag = `"${farmModTime}-${cheeseModTime || 0}-${fishModTime || 0}-${butchersModTime || 0}-${antiquesModTime || 0}-${allLocations.length}"`;

        // Update memory cache
        locationsCache.data = allLocations;
        locationsCache.lastModifiedFarms = farmModTime;
        locationsCache.lastModifiedCheese = cheeseModTime;
        locationsCache.lastModifiedFish = fishModTime;
        locationsCache.lastModifiedButchers = butchersModTime;
        locationsCache.lastModifiedAntiques = antiquesModTime;
        locationsCache.etag = etag;

        console.log(`[Locations API] Serving ${farmStands.length} farm stands + ${cheeseShops.length} cheese shops + ${fishMongers.length} fish mongers + ${butchers.length} butchers + ${antiqueShops.length} antique shops = ${allLocations.length} total locations (cache updated)`);

        // Send with cache headers
        res.set({
            'ETag': etag,
            'Cache-Control': 'public, max-age=3600, must-revalidate',
            'Last-Modified': new Date(Math.max(
                farmModTime,
                cheeseModTime || 0,
                fishModTime || 0,
                butchersModTime || 0,
                antiquesModTime || 0
            )).toUTCString(),
            'X-Cache': 'MISS'
        });
        res.json(allLocations);

    } catch (error) {
        console.error('[Locations API] ERROR:', error);
        if (!res.headersSent) {
            // Differentiate between error types
            if (error.code === 'ENOENT') {
                res.status(503).json({
                    error: "Location data is temporarily unavailable. Please try again in a few moments."
                });
            } else if (error instanceof SyntaxError) {
                console.error('[Locations API] Data file corrupted');
                res.status(500).json({
                    error: "Data file is corrupted. Please contact support."
                });
            } else if (error.code === 'EACCES' || error.code === 'EPERM') {
                console.error('[Locations API] Permission denied');
                res.status(500).json({
                    error: "Server configuration error. Please contact support."
                });
            } else {
                res.status(500).json({
                    error: "An unexpected error occurred while fetching locations."
                });
            }
        }
    }
});

// Proxy for on-demand Google Geocoding API calls from client
app.get('/api/geocode', async (req, res) => {
    const address = sanitizeInput(req.query.address);
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
    const placeId = sanitizeInput(req.query.placeId);
    const fields = sanitizeInput(req.query.fields) || 'name,formatted_address,website,opening_hours,rating,user_ratings_total,photos,formatted_phone_number,url,icon,business_status,reviews,geometry';
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
    const origin = sanitizeInput(req.query.origin);
    const destination = sanitizeInput(req.query.destination);
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
                key: GOOGLE_API_KEY_BACKEND,
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

// Proxy for Google Maps photo requests (to keep API key secure)
app.get('/api/photo', async (req, res) => {
    const photoReference = req.query.photo_reference;
    const maxWidth = req.query.maxwidth || 400;

    if (!photoReference) {
        return res.status(400).json({ error: 'photo_reference query parameter is required' });
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY_BACKEND}`;

    try {
        const response = await fetch(photoUrl);
        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch photo');
        }

        // Get the image data and forward it
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        res.set('Content-Type', response.headers.get('content-type'));
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error proxying photo request:', error);
        res.status(500).json({ error: 'Failed to fetch photo' });
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
// OPTIONAL: Automatic data refresh (disabled by default to reduce API costs)
// To enable: Set DATA_REFRESH_SCHEDULE in .env (e.g., "0 2 * * 0" for weekly Sunday 2 AM)
// By default, data refresh is manual via `npm run process-data`
const CRON_SCHEDULE = process.env.DATA_REFRESH_SCHEDULE;
if (CRON_SCHEDULE && cron.validate(CRON_SCHEDULE)) {
    console.log(`Scheduling location data update (all types) with cron expression: ${CRON_SCHEDULE}`);
    cron.schedule(CRON_SCHEDULE, () => {
        console.log(`[${new Date().toISOString()}] Running scheduled location data update...`);
        updateAllLocationData().catch(err => { // Update all location types
            console.error(`[${new Date().toISOString()}] Scheduled location data update FAILED:`, err);
        });
    });
} else if (CRON_SCHEDULE) {
    console.error(`Invalid CRON_SCHEDULE: ${CRON_SCHEDULE}. Scheduled job will not run.`);
} else {
    console.log('Automatic data refresh is DISABLED. Run `npm run process-data` manually to update location data.');
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
                console.log(`Initial location data files are recent. Skipping immediate update. Next update via cron: ${CRON_SCHEDULE}`);
            } else {
                console.log('Initial location data files are old. Triggering update...');
            }
        } else {
            console.log('Initial location data files not found. Triggering update...');
        }

        if (needsInitialUpdate) {
            await ensureDataUpdate();
        }
    } catch (err) {
        console.error('Error during initial location data check/update:', err);
    }
}, INITIAL_REFRESH_DELAY_MS);


// SPA Fallback Route - Using middleware instead of route
app.use((req, res, next) => {
    // Only handle GET requests
    if (req.method !== 'GET') {
        return next();
    }
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }
    // Skip file requests (anything with an extension)
    if (path.extname(req.path)) {
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
    if (!GOOGLE_API_KEY_BACKEND) {
        console.warn('WARNING: GOOGLE_API_KEY_BACKEND is not set. Google Maps features may not work.');
    }
    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL === "YOUR_GOOGLE_SHEET_PUBLISHED_CSV_URL_HERE") {
        console.warn('WARNING: GOOGLE_SHEET_URL is not set correctly. Farm stand data fetching will fail.');
    }
});