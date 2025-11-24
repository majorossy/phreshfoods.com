// backend/processSheetData.js
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
const { Client, Status } = require("@googlemaps/google-maps-services-js");

const GOOGLE_API_KEY_BACKEND = process.env.GOOGLE_API_KEY_BACKEND;
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;
const GOOGLE_SHEET_URL_CHEESE_SHOPS = process.env.GOOGLE_SHEET_URL_CHEESE_SHOPS;
const GOOGLE_SHEET_URL_FISH_MONGERS = process.env.GOOGLE_SHEET_URL_FISH_MONGERS;
const GOOGLE_SHEET_URL_BUTCHERS = process.env.GOOGLE_SHEET_URL_BUTCHERS;
const GOOGLE_SHEET_URL_ANTIQUE_SHOPS = process.env.GOOGLE_SHEET_URL_ANTIQUE_SHOPS;
const GOOGLE_SHEET_URL_BREWERIES = process.env.GOOGLE_SHEET_URL_BREWERIES;
const GOOGLE_SHEET_URL_WINERIES = process.env.GOOGLE_SHEET_URL_WINERIES;
const GOOGLE_SHEET_URL_SUGAR_SHACKS = process.env.GOOGLE_SHEET_URL_SUGAR_SHACKS;

const FARM_STANDS_OUTPUT_PATH = path.join(__dirname, 'data', 'farmStandsData.json');
const CHEESE_SHOPS_OUTPUT_PATH = path.join(__dirname, 'data', 'cheeseShopsData.json');
const FISH_MONGERS_OUTPUT_PATH = path.join(__dirname, 'data', 'fishMongersData.json');
const BUTCHERS_OUTPUT_PATH = path.join(__dirname, 'data', 'butchersData.json');
const ANTIQUE_SHOPS_OUTPUT_PATH = path.join(__dirname, 'data', 'antiqueShopsData.json');
const BREWERIES_OUTPUT_PATH = path.join(__dirname, 'data', 'breweriesData.json');
const WINERIES_OUTPUT_PATH = path.join(__dirname, 'data', 'wineriesData.json');
const SUGAR_SHACKS_OUTPUT_PATH = path.join(__dirname, 'data', 'sugarShacksData.json');

// Backward compatibility
const OUTPUT_JSON_PATH = FARM_STANDS_OUTPUT_PATH;

// --- CHANGE THE DELAY HERE ---
const DELAY_BETWEEN_API_CALLS_MS = 500; // Changed to 500ms (half a second)

const googleMapsClient = new Client({});

function parseCSVLine(line) {
    // ... (your existing parseCSVLine function)
    const values = [];
    let currentVal = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                currentVal += '"'; i++;
            } else { inQuotes = !inQuotes; }
        } else if (char === ',' && !inQuotes) {
            values.push(currentVal.trim()); currentVal = '';
        } else { currentVal += char; }
    }
    values.push(currentVal.trim());
    return values;
}

// Decode HTML entities (e.g., &#39; to ')
function decodeHTMLEntities(text) {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&'); // Must be last to avoid double-decoding
}

// Generate a URL-safe slug from a name
function generateSlug(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

async function getPlaceDetailsWithDelay(placeId, fieldsArray = ['geometry']) {
    if (!placeId) return null;
    // The delay is already implemented here before the API call
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_API_CALLS_MS));
    console.log(`[Processor] Fetching Place Details: ${placeId}, Fields: ${fieldsArray.join(',')}`);
    try {
        const response = await googleMapsClient.placeDetails({
            params: { place_id: placeId, fields: fieldsArray, key: GOOGLE_API_KEY_BACKEND },
            timeout: 5000, // Adjust timeout if needed, 5s is reasonable
        });
        if (response.data.status === Status.OK && response.data.result) {
            return response.data.result;
        } else {
            console.warn(`[Processor] Place Details failed for ID "${placeId}" (Fields: ${fieldsArray.join(',')}) : ${response.data.status}`, response.data.error_message || '');
            return null;
        }
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[Processor] Place Details error for ID "${placeId}":`, errorMessage);
        return null;
    }
}

async function geocodeAddressWithDelay(address) {
    if (!address) return null;
    // The delay is already implemented here before the API call
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_API_CALLS_MS));
    console.log(`[Processor] Geocoding: ${address}`);
    try {
        const response = await googleMapsClient.geocode({
            params: {
                address: address,
                key: GOOGLE_API_KEY_BACKEND,
                components: { country: 'US', administrative_area: 'ME' }
            },
            timeout: 5000, // Adjust timeout if needed
        });
        if (response.data.status === Status.OK && response.data.results.length > 0) {
            const loc = response.data.results[0].geometry.location;
            return {
                lat: loc.lat,
                lng: loc.lng,
                viewport: response.data.results[0].geometry.viewport,
                formatted_address: response.data.results[0].formatted_address,
                place_id: response.data.results[0].place_id
            };
        } else {
            console.warn(`[Processor] Geocoding failed for "${address}": ${response.data.status}`, response.data.error_message || '');
            return null;
        }
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[Processor] Geocoding error for "${address}":`, errorMessage);
        return null;
    }
}

// Product column mappings for different location types
const FARM_STAND_PRODUCT_COLUMNS = [
    'beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'eggs',
    'corn', 'carrots', 'garlic', 'onions', 'potatoes', 'lettuce', 'spinach',
    'squash', 'tomatoes', 'peppers', 'cucumbers', 'zucchini',
    'strawberries', 'blueberries'
];

const CHEESE_SHOP_PRODUCT_COLUMNS = [
    'cheddar', 'brie', 'gouda', 'mozzarella', 'feta', 'blue_cheese',
    'parmesan', 'swiss', 'provolone',
    'cow_milk', 'goat_milk', 'sheep_milk'
];

const FISH_MONGER_PRODUCT_COLUMNS = [
    'salmon', 'cod', 'haddock', 'tuna', 'lobster', 'shrimp', 'crab',
    'oysters', 'clams', 'mussels', 'scallops', 'halibut'
];

const BUTCHER_PRODUCT_COLUMNS = [
    'beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'veal',
    'sausages', 'bacon', 'ground_meat', 'steaks', 'roasts'
];

const ANTIQUE_SHOP_PRODUCT_COLUMNS = [
    'furniture', 'jewelry', 'art', 'books', 'ceramics', 'glassware',
    'silverware', 'textiles', 'collectibles', 'vintage_clothing'
];

const BREWERY_PRODUCT_COLUMNS = [
    'ipa', 'lager', 'stout', 'ale', 'pilsner', 'wheat_beer',
    'tours', 'tastings', 'food', 'outdoor_seating'
];

const WINERY_PRODUCT_COLUMNS = [
    'red_wine', 'white_wine', 'rose', 'sparkling', 'dessert_wine',
    'tours', 'tastings', 'food', 'vineyard_views', 'events'
];

const SUGAR_SHACK_PRODUCT_COLUMNS = [
    'maple_syrup', 'maple_candy', 'maple_cream', 'maple_sugar',
    'tours', 'tastings', 'pancake_breakfast', 'seasonal_events'
];

// Helper function to create a hash of location data to detect changes
function createLocationHash(shopData) {
    // Hash key fields that indicate a location has changed (requires Google API calls)
    const hashData = {
        name: shopData.Name,
        address: shopData.Address,
        city: shopData.City,
        zip: shopData.Zip,
        phone: shopData.Phone,
        website: shopData.Website,
        googleProfileId: shopData.GoogleProfileID
    };
    return JSON.stringify(hashData);
}

// Helper function to create a hash of product data to detect product changes
function createProductHash(shopData) {
    // Products don't require API calls, just need to update JSON
    return JSON.stringify(shopData.products || {});
}

// Generic function to process location data of any type
async function processLocationData(locationType, sheetUrl, outputPath, productColumns) {
    console.log(`[Processor] Starting ${locationType} data update process...`);
    if (!sheetUrl || sheetUrl.includes("YOUR_") || sheetUrl.includes("SPREADSHEET_ID")) {
        console.error(`[Processor] ERROR: Sheet URL for ${locationType} is not configured correctly. Aborting.`);
        return;
    }
    if (!GOOGLE_API_KEY_BACKEND) {
        console.error('[Processor] ERROR: GOOGLE_API_KEY_BACKEND is not configured. Geocoding will fail. Aborting.');
        return;
    }

    try {
        // Load existing data for change detection
        let existingData = {};
        if (await fs.pathExists(outputPath)) {
            try {
                const existingArray = await fs.readJson(outputPath);
                existingArray.forEach(location => {
                    const key = location.GoogleProfileID || location.slug || location.Name;
                    existingData[key] = {
                        hash: createLocationHash(location),
                        data: location
                    };
                });
                console.log(`[Processor] Loaded ${existingArray.length} existing ${locationType} locations for change detection`);
            } catch (err) {
                console.warn(`[Processor] Could not load existing data for change detection:`, err.message);
            }
        }

        // Fetch directly from Google Sheets (follows redirects automatically)
        console.log(`[Processor] Fetching CSV from ${locationType} sheet...`);
        console.log(`[Processor] DEBUG: Sheet URL = ${sheetUrl}`);
        const sheetResponse = await fetch(sheetUrl, {
            redirect: 'follow'
        });
        if (!sheetResponse.ok) {
            throw new Error(`[Processor] Failed to fetch sheet data: ${sheetResponse.statusText}`);
        }
        const csvText = await sheetResponse.text();
        if (!csvText || csvText.trim() === "") {
            console.error(`[Processor] No data received from ${locationType} CSV.`);
            return;
        }
        console.log(`[Processor] ${locationType} CSV data fetched successfully.`);

        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) {
            console.error(`[Processor] ${locationType} CSV data has insufficient lines.`);
            return;
        }

        const headerLine = lines.shift();
        const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());

        // Build header map dynamically based on common and product-specific columns
        const headerMap = {
            name: headers.indexOf("name"),
            address: headers.indexOf("address"),
            city: headers.indexOf("city"),
            zip: headers.indexOf("zip"),
            rating: headers.indexOf("rating"),
            phone: headers.indexOf("phone"),
            website: headers.indexOf("website"),
            googleprofileid: headers.indexOf("place id"),
            imageone: headers.indexOf("image_one"),
            imagetwo: headers.indexOf("image_two"),
            imagethree: headers.indexOf("image_three"),
            xhandle: headers.indexOf("x"),
            facebookpageid: headers.indexOf("facebook"),
            instagramusername: headers.indexOf("instagram username"),
            instagramlink: headers.indexOf("instagram"),
            slugUrl: headers.indexOf("url"),
        };

        // Add product-specific columns to header map
        productColumns.forEach(product => {
            // Handle lettuce special case (sheet might have "lettus" or "lettuce")
            if (product === 'lettuce') {
                const lettusIdx = headers.indexOf("lettus");
                const lettuceIdx = headers.indexOf("lettuce");
                headerMap[product] = lettuceIdx !== -1 ? lettuceIdx : lettusIdx;
            } else {
                headerMap[product] = headers.indexOf(product);
            }
        });

        const processedShops = [];
        const fieldsToFetchFromPlaces = [ /* ... your fields ... */
            'place_id', 'name', 'formatted_address', 'geometry',
            'rating', 'user_ratings_total', 'website', 'business_status',
            'opening_hours', 'photos', 'reviews', 'url'
        ];

        let apiCallsSkipped = 0;
        let apiCallsMade = 0;

        for (const line of lines) {
            if (!line.trim()) continue;
            // ... (your shop object creation logic) ...
            const rawValues = parseCSVLine(line);
            // Inside the for (const line of lines) loop:
            const getStringValue = (key) => { // REMOVED: : string
                const index = headerMap[key]; // REMOVED: as keyof typeof headerMap (and simplified)
                const value = (index === -1 || typeof index === 'undefined' || index >= rawValues.length) ? "" : (rawValues[index] || "");
                return decodeHTMLEntities(value);
            };
            const getProductBoolean = (key) => { // REMOVED: : string
                const val = getStringValue(key).trim().toLowerCase();
                return ['true', '1', 'yes', 't', 'x', 'available'].includes(val);
            };

            const shopName = getStringValue("name") || `${locationType} (Name Missing)`;
            const providedSlug = getStringValue("slugUrl").trim();
            // Ignore the provided slug if it's a URL - generate a proper slug from the name instead
            const isUrl = providedSlug.startsWith('http://') || providedSlug.startsWith('https://');
            const finalSlug = (providedSlug && !isUrl) ? providedSlug : generateSlug(shopName);

            // Build products object dynamically based on product columns
            const products = {};
            productColumns.forEach(product => {
                products[product] = getProductBoolean(product);
            });

            let shop = {
                type: locationType,
                Name: shopName,
                Address: getStringValue("address") || "N/A",
                City: getStringValue("city") || "N/A",
                Zip: getStringValue("zip") || "N/A",
                Rating: getStringValue("rating") || "N/A",
                Phone: getStringValue("phone"),
                Website: getStringValue("website"),
                GoogleProfileID: getStringValue("googleprofileid"),
                slug: finalSlug,
                XHandle: getStringValue("xhandle"),
                FacebookPageID: getStringValue("facebookpageid"),
                InstagramUsername: getStringValue("instagramusername"),
                InstagramRecentPostEmbedCode: '',
                InstagramLink: getStringValue("instagramlink"),
                ImageOne: getStringValue("imageone"),
                ImageTwo: getStringValue("imagetwo"),
                ImageThree: getStringValue("imagethree"),
                products: products,
                lat: null,
                lng: null,
                placeDetails: {}
            };


            if (!shop.Name || shop.Name.includes("(Name Missing)") || shop.Name.trim() === "N/A") {
                console.log(`[Processor] Skipping row due to missing or invalid Name: ${line.substring(0, 50)}...`);
                continue;
            }

            // Check if this location has changed since last run
            const locationKey = shop.GoogleProfileID || finalSlug || shop.Name;
            const newHash = createLocationHash(shop);
            const newProductHash = createProductHash(shop);
            const existingLocation = existingData[locationKey];

            let googlePlaceAPIData = null;

            // Check for location changes (requires API calls) vs product changes (no API needed)
            if (existingLocation && existingLocation.hash === newHash && existingLocation.data.lat && existingLocation.data.lng) {
                // Location data hasn't changed - check if products changed
                const oldProductHash = createProductHash(existingLocation.data);

                if (oldProductHash === newProductHash) {
                    // Nothing changed at all - reuse everything
                    console.log(`[Processor] ✓ No changes detected for "${shop.Name}" - reusing cached data (SAVED ~2-3 API CALLS)`);
                    processedShops.push(existingLocation.data);
                    apiCallsSkipped += 2; // Estimated: geocoding + place details
                    continue;
                } else {
                    // Only products changed - update products without API calls
                    console.log(`[Processor] 📦 Product changes detected for "${shop.Name}" - updating products only (SAVED ~2-3 API CALLS)`);
                    const updatedShop = {
                        ...existingLocation.data,
                        products: shop.products // Update with new product data
                    };
                    processedShops.push(updatedShop);
                    apiCallsSkipped += 2; // Still saved API calls
                    continue;
                }
            }

            if (existingLocation && existingLocation.hash !== newHash) {
                console.log(`[Processor] ⚠ Changes detected for "${shop.Name}" - will update from Google APIs`);
            } else if (!existingLocation) {
                console.log(`[Processor] ⭐ New location "${shop.Name}" - will fetch from Google APIs`);
            }

            if (shop.GoogleProfileID) {
                googlePlaceAPIData = await getPlaceDetailsWithDelay(shop.GoogleProfileID, fieldsToFetchFromPlaces);
                apiCallsMade++;
            }

            // This logic ensures that if Place Details didn't give geometry,
            // or if there was no GoogleProfileID initially, we try to geocode the address.
            if ((!googlePlaceAPIData || !googlePlaceAPIData.geometry) && shop.Address && shop.Address !== "N/A") {
                const fullAddress = `${shop.Address}, ${shop.City || ''} ${shop.Zip || ''}, Maine`.replace(/,\s*,/, ',').trim();
                const geocodedData = await geocodeAddressWithDelay(fullAddress);
                apiCallsMade++;

                if (geocodedData && geocodedData.place_id) {
                    // If we got a place_id from geocoding, and we didn't have one before, or if the initial Place Details call failed,
                    // try getting Place Details again with this new/confirmed place_id.
                    if (!shop.GoogleProfileID) shop.GoogleProfileID = geocodedData.place_id;

                    // Only refetch place details if the first attempt (if any) failed or if we just got a new place_id
                    if (!googlePlaceAPIData || shop.GoogleProfileID === geocodedData.place_id) {
                         googlePlaceAPIData = await getPlaceDetailsWithDelay(geocodedData.place_id, fieldsToFetchFromPlaces);
                         apiCallsMade++;
                    }
                } else if (geocodedData) {
                    // Geocoded successfully but didn't get a place_id (e.g., street address, not a POI)
                    // We only want to use these coordinates if we couldn't get them from Place Details
                    if (!googlePlaceAPIData || !googlePlaceAPIData.geometry) {
                        shop.lat = geocodedData.lat;
                        shop.lng = geocodedData.lng;
                        // Optionally update address if geocoded one is better and different
                        if (geocodedData.formatted_address && (shop.Address === "N/A" || shop.Address.toLowerCase() !== geocodedData.formatted_address.toLowerCase())) {
                            // console.log(`[Processor] Updating address for ${shop.Name} from "${shop.Address}" to "${geocodedData.formatted_address}"`);
                            // shop.Address = geocodedData.formatted_address; // Be cautious with overwriting sheet data
                        }
                    }
                }
            }
            // ... (rest of your shop processing logic for googlePlaceAPIData) ...
            if (googlePlaceAPIData) {
                if (googlePlaceAPIData.geometry && googlePlaceAPIData.geometry.location) {
                    shop.lat = googlePlaceAPIData.geometry.location.lat;
                    shop.lng = googlePlaceAPIData.geometry.location.lng;
                }
                // Keep sheet's name (don't overwrite with Google's data)
                // Only use Google's name as fallback if sheet doesn't have one
                if (!shop.Name || shop.Name.includes("(Name Missing)") || shop.Name.trim() === "N/A") {
                    shop.Name = googlePlaceAPIData.name || shop.Name;
                }
                // Update address with Google's formatted address
                shop.Address = googlePlaceAPIData.formatted_address || shop.Address;

                shop.placeDetails = {
                    place_id: googlePlaceAPIData.place_id,
                    name: googlePlaceAPIData.name,
                    formatted_address: googlePlaceAPIData.formatted_address,
                    rating: googlePlaceAPIData.rating,
                    user_ratings_total: googlePlaceAPIData.user_ratings_total,
                    website: googlePlaceAPIData.website,
                    business_status: googlePlaceAPIData.business_status,
                    opening_hours: googlePlaceAPIData.opening_hours,
                    // Storing only photo_references or minimal photo data can save space
                    photos: googlePlaceAPIData.photos?.map(p => ({ photo_reference: p.photo_reference, height: p.height, width: p.width, html_attributions: p.html_attributions })),
                    reviews: googlePlaceAPIData.reviews?.slice(0, 5), // Store a few reviews
                    url: googlePlaceAPIData.url, // Google Maps URL for the place
                    geometry: googlePlaceAPIData.geometry // Save geometry too
                };
                
                if (shop.placeDetails.rating !== undefined) shop.Rating = shop.placeDetails.rating.toString();
                if (shop.placeDetails.website) shop.Website = shop.placeDetails.website;
            }

            if (shop.lat && shop.lng) {
                processedShops.push(shop);
            } else {
                console.warn(`[Processor] Could not determine lat/lng for shop: ${shop.Name} (ID: ${shop.GoogleProfileID || 'N/A'}, Address: ${shop.Address}). Skipping.`);
            }
        }

        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeJson(outputPath, processedShops, { spaces: 2 });
        console.log(`\n========================================`);
        console.log(`[Processor] ✅ Successfully processed ${processedShops.length} ${locationType} locations`);
        console.log(`[Processor] 💰 API Calls Made: ${apiCallsMade}`);
        console.log(`[Processor] 💚 API Calls Skipped (cached): ${apiCallsSkipped}`);
        console.log(`[Processor] 📊 Cost Savings: ${Math.round((apiCallsSkipped / (apiCallsMade + apiCallsSkipped)) * 100)}%`);
        console.log(`[Processor] 📁 Saved to: ${outputPath}`);
        console.log(`========================================\n`);

    } catch (error) {
        console.error(`[Processor] Error during ${locationType} data update process:`, error);
    }
}

// Wrapper function for farm stands (backward compatibility)
async function updateFarmStandsData() {
    return await processLocationData('farm_stand', GOOGLE_SHEET_URL, FARM_STANDS_OUTPUT_PATH, FARM_STAND_PRODUCT_COLUMNS);
}

// New function for cheese shops
async function updateCheeseShopsData() {
    return await processLocationData('cheese_shop', GOOGLE_SHEET_URL_CHEESE_SHOPS, CHEESE_SHOPS_OUTPUT_PATH, CHEESE_SHOP_PRODUCT_COLUMNS);
}

// Function for fish mongers
async function updateFishMongersData() {
    return await processLocationData('fish_monger', GOOGLE_SHEET_URL_FISH_MONGERS, FISH_MONGERS_OUTPUT_PATH, FISH_MONGER_PRODUCT_COLUMNS);
}

// Function for butchers
async function updateButchersData() {
    return await processLocationData('butcher', GOOGLE_SHEET_URL_BUTCHERS, BUTCHERS_OUTPUT_PATH, BUTCHER_PRODUCT_COLUMNS);
}

// Function for antique shops
async function updateAntiqueShopsData() {
    return await processLocationData('antique_shop', GOOGLE_SHEET_URL_ANTIQUE_SHOPS, ANTIQUE_SHOPS_OUTPUT_PATH, ANTIQUE_SHOP_PRODUCT_COLUMNS);
}

// Function for breweries
async function updateBreweriesData() {
    return await processLocationData('brewery', GOOGLE_SHEET_URL_BREWERIES, BREWERIES_OUTPUT_PATH, BREWERY_PRODUCT_COLUMNS);
}

// Function for wineries
async function updateWineriesData() {
    return await processLocationData('winery', GOOGLE_SHEET_URL_WINERIES, WINERIES_OUTPUT_PATH, WINERY_PRODUCT_COLUMNS);
}

// Function for sugar shacks
async function updateSugarShacksData() {
    return await processLocationData('sugar_shack', GOOGLE_SHEET_URL_SUGAR_SHACKS, SUGAR_SHACKS_OUTPUT_PATH, SUGAR_SHACK_PRODUCT_COLUMNS);
}

// Function to update all location types
async function updateAllLocationData() {
    console.log('[Processor] Starting update for all location types...');

    // Always update farm stands
    await updateFarmStandsData();

    // Update cheese shops if configured
    if (GOOGLE_SHEET_URL_CHEESE_SHOPS && !GOOGLE_SHEET_URL_CHEESE_SHOPS.includes("YOUR_") && !GOOGLE_SHEET_URL_CHEESE_SHOPS.includes("SPREADSHEET_ID")) {
        await updateCheeseShopsData();
    } else {
        console.log('[Processor] Cheese shops sheet URL not configured, skipping...');
    }

    // Update fish mongers if configured
    if (GOOGLE_SHEET_URL_FISH_MONGERS && !GOOGLE_SHEET_URL_FISH_MONGERS.includes("YOUR_") && !GOOGLE_SHEET_URL_FISH_MONGERS.includes("SPREADSHEET_ID")) {
        await updateFishMongersData();
    } else {
        console.log('[Processor] Fish mongers sheet URL not configured, skipping...');
    }

    // Update butchers if configured
    if (GOOGLE_SHEET_URL_BUTCHERS && !GOOGLE_SHEET_URL_BUTCHERS.includes("YOUR_") && !GOOGLE_SHEET_URL_BUTCHERS.includes("SPREADSHEET_ID")) {
        await updateButchersData();
    } else {
        console.log('[Processor] Butchers sheet URL not configured, skipping...');
    }

    // Update antique shops if configured
    if (GOOGLE_SHEET_URL_ANTIQUE_SHOPS && !GOOGLE_SHEET_URL_ANTIQUE_SHOPS.includes("YOUR_") && !GOOGLE_SHEET_URL_ANTIQUE_SHOPS.includes("SPREADSHEET_ID")) {
        await updateAntiqueShopsData();
    } else {
        console.log('[Processor] Antique shops sheet URL not configured, skipping...');
    }

    // Update breweries if configured
    if (GOOGLE_SHEET_URL_BREWERIES && !GOOGLE_SHEET_URL_BREWERIES.includes("YOUR_") && !GOOGLE_SHEET_URL_BREWERIES.includes("SPREADSHEET_ID")) {
        await updateBreweriesData();
    } else {
        console.log('[Processor] Breweries sheet URL not configured, skipping...');
    }

    // Update wineries if configured
    if (GOOGLE_SHEET_URL_WINERIES && !GOOGLE_SHEET_URL_WINERIES.includes("YOUR_") && !GOOGLE_SHEET_URL_WINERIES.includes("SPREADSHEET_ID")) {
        await updateWineriesData();
    } else {
        console.log('[Processor] Wineries sheet URL not configured, skipping...');
    }

    // Update sugar shacks if configured
    if (GOOGLE_SHEET_URL_SUGAR_SHACKS && !GOOGLE_SHEET_URL_SUGAR_SHACKS.includes("YOUR_") && !GOOGLE_SHEET_URL_SUGAR_SHACKS.includes("SPREADSHEET_ID")) {
        await updateSugarShacksData();
    } else {
        console.log('[Processor] Sugar shacks sheet URL not configured, skipping...');
    }

    console.log('[Processor] All location data updated.');
}

module.exports = {
    updateFarmStandsData,
    updateCheeseShopsData,
    updateFishMongersData,
    updateButchersData,
    updateAntiqueShopsData,
    updateBreweriesData,
    updateWineriesData,
    updateSugarShacksData,
    updateAllLocationData
};

// if require.main === module block
if (require.main === module) {
    console.log('Running processor directly...');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const typeArg = args.find(arg => arg.startsWith('--type='));
    const typeFilter = typeArg ? typeArg.split('=')[1] : null;

    // Map of valid types
    const typeMap = {
        'farms': updateFarmStandsData,
        'farm-stands': updateFarmStandsData,
        'cheese': updateCheeseShopsData,
        'cheese-shops': updateCheeseShopsData,
        'fish': updateFishMongersData,
        'fish-mongers': updateFishMongersData,
        'butchers': updateButchersData,
        'antiques': updateAntiqueShopsData,
        'antique-shops': updateAntiqueShopsData,
        'breweries': updateBreweriesData,
        'wineries': updateWineriesData,
        'sugar-shacks': updateSugarShacksData,
        'sugarshacks': updateSugarShacksData
    };

    let updatePromise;

    if (typeFilter) {
        const updateFn = typeMap[typeFilter.toLowerCase()];
        if (updateFn) {
            console.log(`\n🎯 Updating only: ${typeFilter}\n`);
            updatePromise = updateFn();
        } else {
            console.error(`\n❌ Invalid type: ${typeFilter}`);
            console.error('Valid types: farms, cheese, fish, butchers, antiques\n');
            console.error('Example: npm run process-data -- --type=farms\n');
            process.exit(1);
        }
    } else {
        console.log('\n🌐 Updating all location types\n');
        updatePromise = updateAllLocationData();
    }

    updatePromise.then(() => {
        console.log('\n✅ Direct run finished.\n');
        process.exit(0);
    }).catch(err => {
        console.error('\n❌ Direct run failed:', err);
        process.exit(1);
    });
}