// backend/processSheetData.js
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
const { Client, Status } = require("@googlemaps/google-maps-services-js");

const GOOGLE_API_KEY_BACKEND = process.env.GOOGLE_API_KEY_BACKEND;
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;
const OUTPUT_JSON_PATH = path.join(__dirname, 'data', 'farmStandsData.json');

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

async function updateFarmStandsData() {
    console.log('[Processor] Starting farm stands data update process...');
    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.includes("YOUR_GOOGLE_SHEET_PUBLISHED_CSV_URL_HERE")) {
        console.error('[Processor] ERROR: GOOGLE_SHEET_URL is not configured correctly. Aborting.');
        return;
    }
    if (!GOOGLE_API_KEY_BACKEND) {
        console.error('[Processor] ERROR: GOOGLE_API_KEY_BACKEND is not configured. Geocoding will fail. Aborting.');
        return;
    }

    try {
        // ... (rest of your CSV fetching logic) ...
        // Fetch directly from Google Sheets (follows redirects automatically)
        console.log(`[Processor] Fetching CSV from sheet...`);
        const sheetResponse = await fetch(GOOGLE_SHEET_URL, {
            redirect: 'follow'
        });
        if (!sheetResponse.ok) {
            throw new Error(`[Processor] Failed to fetch sheet data: ${sheetResponse.statusText}`);
        }
        const csvText = await sheetResponse.text();
        if (!csvText || csvText.trim() === "") {
            console.error("[Processor] No data received from source CSV.");
            return;
        }
        console.log("[Processor] CSV data fetched successfully.");

        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) {
            console.error("[Processor] CSV data has insufficient lines.");
            return;
        }

        const headerLine = lines.shift();
        const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
        const headerMap = {
            name: headers.indexOf("name"), address: headers.indexOf("address"), city: headers.indexOf("city"),
            zip: headers.indexOf("zip"), rating: headers.indexOf("rating"), phone: headers.indexOf("phone"),
            website: headers.indexOf("website"), googleprofileid: headers.indexOf("place id"),
            imageone: headers.indexOf("image_one"), imagetwo: headers.indexOf("image_two"),
            imagethree: headers.indexOf("image_three"), xhandle: headers.indexOf("x"),
            facebookpageid: headers.indexOf("facebook"), instagramusername: headers.indexOf("instagram username"),
            instagramlink: headers.indexOf("instagram"),
            beef: headers.indexOf("beef"), pork: headers.indexOf("pork"), lamb: headers.indexOf("lamb"),
            chicken: headers.indexOf("chicken"), turkey: headers.indexOf("turkey"), duck: headers.indexOf("duck"),
            eggs: headers.indexOf("eggs"), corn: headers.indexOf("corn"), carrots: headers.indexOf("carrots"),
            garlic: headers.indexOf("garlic"), onions: headers.indexOf("onions"), potatoes: headers.indexOf("potatoes"),
            lettus: headers.indexOf("lettus"), spinach: headers.indexOf("spinach"), squash: headers.indexOf("squash"),
            tomatoes: headers.indexOf("tomatoes"), peppers: headers.indexOf("peppers"), cucumbers: headers.indexOf("cucumbers"),
            zucchini: headers.indexOf("zucchini"), strawberries: headers.indexOf("strawberries"), blueberries: headers.indexOf("blueberries"),
            slugUrl: headers.indexOf("url"),
        };

        const processedShops = [];
        const fieldsToFetchFromPlaces = [ /* ... your fields ... */
            'place_id', 'name', 'formatted_address', 'geometry',
            'rating', 'user_ratings_total', 'website', 'business_status',
            'opening_hours', 'photos', 'reviews', 'url'
        ];

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

            const shopName = getStringValue("name") || "Farm Stand (Name Missing)";
            const providedSlug = getStringValue("slugUrl").trim();

            let shop = {
                Name: shopName,
                Address: getStringValue("address") || "N/A",
                City: getStringValue("city") || "N/A",
                Zip: getStringValue("zip") || "N/A",
                Rating: getStringValue("rating") || "N/A",
                Phone: getStringValue("phone"),
                Website: getStringValue("website"),
                GoogleProfileID: getStringValue("googleprofileid"),
                slug: providedSlug || generateSlug(shopName),
                XHandle: getStringValue("xhandle"),
                FacebookPageID: getStringValue("facebookpageid"),
                InstagramUsername: getStringValue("instagramusername"),
                InstagramRecentPostEmbedCode: '',
                InstagramLink: getStringValue("instagramlink"),
                ImageOne: getStringValue("imageone"), ImageTwo: getStringValue("imagetwo"), ImageThree: getStringValue("imagethree"),
                beef: getProductBoolean("beef"), pork: getProductBoolean("pork"), lamb: getProductBoolean("lamb"),
                chicken: getProductBoolean("chicken"), turkey: getProductBoolean("turkey"), duck: getProductBoolean("duck"),
                eggs: getProductBoolean("eggs"), corn: getProductBoolean("corn"), carrots: getProductBoolean("carrots"),
                garlic: getProductBoolean("garlic"), onions: getProductBoolean("onions"), potatoes: getProductBoolean("potatoes"),
                lettus: getProductBoolean("lettus"), spinach: getProductBoolean("spinach"), squash: getProductBoolean("squash"),
                tomatoes: getProductBoolean("tomatoes"), peppers: getProductBoolean("peppers"), cucumbers: getProductBoolean("cucumbers"),
                zucchini: getProductBoolean("zucchini"), strawberries: getProductBoolean("strawberries"), blueberries: getProductBoolean("blueberries"),
                lat: null,
                lng: null,
                placeDetails: {}
            };


            if (!shop.Name || shop.Name === "Farm Stand (Name Missing)" || shop.Name.trim() === "N/A") {
                console.log(`[Processor] Skipping row due to missing or invalid Name: ${line.substring(0, 50)}...`);
                continue;
            }

            let googlePlaceAPIData = null;

            if (shop.GoogleProfileID) {
                googlePlaceAPIData = await getPlaceDetailsWithDelay(shop.GoogleProfileID, fieldsToFetchFromPlaces);
            }

            // This logic ensures that if Place Details didn't give geometry,
            // or if there was no GoogleProfileID initially, we try to geocode the address.
            if ((!googlePlaceAPIData || !googlePlaceAPIData.geometry) && shop.Address && shop.Address !== "N/A") {
                const fullAddress = `${shop.Address}, ${shop.City || ''} ${shop.Zip || ''}, Maine`.replace(/,\s*,/, ',').trim();
                const geocodedData = await geocodeAddressWithDelay(fullAddress);

                if (geocodedData && geocodedData.place_id) {
                    // If we got a place_id from geocoding, and we didn't have one before, or if the initial Place Details call failed,
                    // try getting Place Details again with this new/confirmed place_id.
                    if (!shop.GoogleProfileID) shop.GoogleProfileID = geocodedData.place_id;

                    // Only refetch place details if the first attempt (if any) failed or if we just got a new place_id
                    if (!googlePlaceAPIData || shop.GoogleProfileID === geocodedData.place_id) {
                         googlePlaceAPIData = await getPlaceDetailsWithDelay(geocodedData.place_id, fieldsToFetchFromPlaces);
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
                // Prioritize Google's name and address if available
                shop.Name = googlePlaceAPIData.name || shop.Name;
                shop.Address = googlePlaceAPIData.formatted_address || shop.Address;

                shop.placeDetails = {
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

        await fs.ensureDir(path.dirname(OUTPUT_JSON_PATH));
        await fs.writeJson(OUTPUT_JSON_PATH, processedShops, { spaces: 2 });
        console.log(`[Processor] Successfully processed ${processedShops.length} farm stands and saved to ${OUTPUT_JSON_PATH}`);

    } catch (error) {
        console.error("[Processor] Error during farm stands data update process:", error);
    }
}

module.exports = { updateFarmStandsData };

// if require.main === module block
if (require.main === module) {
    console.log('Running processor directly...');
    updateFarmStandsData().then(() => {
        console.log('Direct run finished.');
        process.exit(0);
    }).catch(err => {
        console.error('Direct run failed:', err);
        process.exit(1);
    });
}