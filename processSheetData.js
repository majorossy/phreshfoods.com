// processSheetData.js
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
const { Client, Status } = require("@googlemaps/google-maps-services-js");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;
const OUTPUT_JSON_PATH = path.join(__dirname, 'data', 'farmStandsData.json');
const DELAY_BETWEEN_API_CALLS_MS = 1000; // Adjust as needed

const googleMapsClient = new Client({});

function parseCSVLine(line) {
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

async function getPlaceDetailsWithDelay(placeId, fieldsArray = ['geometry']) {
    if (!placeId) return null;
    console.log(`[Processor] Fetching Place Details: ${placeId}, Fields: ${fieldsArray.join(',')}`);
    try {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_API_CALLS_MS));
        const response = await googleMapsClient.placeDetails({
            params: { place_id: placeId, fields: fieldsArray, key: GOOGLE_MAPS_API_KEY },
            timeout: 5000,
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
    console.log(`[Processor] Geocoding: ${address}`);
    try {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_API_CALLS_MS));
        const response = await googleMapsClient.geocode({
            params: {
                address: address,
                key: GOOGLE_MAPS_API_KEY,
                components: { country: 'US', administrative_area: 'ME' }
            },
            timeout: 5000,
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
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('[Processor] ERROR: GOOGLE_MAPS_API_KEY is not configured. Geocoding will fail. Aborting.');
        return;
    }

    try {
        const PROXY_URL = "https://api.allorigins.win/raw?url=";
        const DATA_FETCH_URL = PROXY_URL + encodeURIComponent(GOOGLE_SHEET_URL);
        console.log(`[Processor] Fetching CSV from sheet...`);
        const sheetResponse = await fetch(DATA_FETCH_URL);
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

        const processedShops = [];
        const fieldsToFetchFromPlaces = [
            'place_id', 'name', 'formatted_address', 'geometry', // geometry for lat/lng
            'rating', 'user_ratings_total', 'website', 'business_status',
            'opening_hours', 'photos', 'reviews', 'url'
        ];

        for (const line of lines) {
            if (!line.trim()) continue;

            const rawValues = parseCSVLine(line);
            const getStringValue = (key) => {
                const index = headerMap[key];
                return (index === -1 || typeof index === 'undefined' || index >= rawValues.length) ? "" : (rawValues[index] || "");
            };
            const getProductBoolean = (key) => {
                const val = getStringValue(key).trim().toLowerCase();
                return ['true', '1', 'yes', 't', 'x', 'available'].includes(val);
            };
            const encodedEmbed = getStringValue("instagramembedcode");
            let decodedEmbed = '';
            if (encodedEmbed) { try { decodedEmbed = Buffer.from(encodedEmbed, 'base64').toString('utf-8'); } catch (e) { decodedEmbed = "<!-- Invalid Embed -->"; } }

            let shop = {
                Name: getStringValue("name") || "Farm Stand (Name Missing)",
                Address: getStringValue("address") || "N/A",
                City: getStringValue("city") || "N/A",
                Zip: getStringValue("zip") || "N/A",
                Rating: getStringValue("rating") || "N/A",
                Phone: getStringValue("phone"),
                Website: getStringValue("website"),
                GoogleProfileID: getStringValue("googleprofileid"),
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
                lat: null,
                lng: null,
                placeDetails: {} // Initialize to store enriched Google data
            };

            if (!shop.Name || shop.Name === "Farm Stand (Name Missing)" || shop.Name.trim() === "N/A") {
                console.log(`[Processor] Skipping row due to missing or invalid Name: ${line.substring(0, 50)}...`);
                continue;
            }

            let googlePlaceAPIData = null;

            if (shop.GoogleProfileID) {
                googlePlaceAPIData = await getPlaceDetailsWithDelay(shop.GoogleProfileID, fieldsToFetchFromPlaces);
            }

            if ((!googlePlaceAPIData || !googlePlaceAPIData.geometry) && shop.Address && shop.Address !== "N/A") {
                const fullAddress = `${shop.Address}, ${shop.City || ''} ${shop.Zip || ''}, Maine`.replace(/,\s*,/, ',').trim();
                const geocodedData = await geocodeAddressWithDelay(fullAddress);
                if (geocodedData && geocodedData.place_id) {
                    if (!shop.GoogleProfileID) shop.GoogleProfileID = geocodedData.place_id; // Update if sheet was missing it
                    googlePlaceAPIData = await getPlaceDetailsWithDelay(shop.GoogleProfileID, fieldsToFetchFromPlaces);
                } else if (geocodedData) { // Geocoded but no Place ID
                    shop.lat = geocodedData.lat;
                    shop.lng = geocodedData.lng;
                    if (shop.Address === "N/A" || shop.Address !== geocodedData.formatted_address) {
                        shop.Address = geocodedData.formatted_address;
                    }
                }
            }

            if (googlePlaceAPIData) {
                if (googlePlaceAPIData.geometry && googlePlaceAPIData.geometry.location) {
                    shop.lat = googlePlaceAPIData.geometry.location.lat;
                    shop.lng = googlePlaceAPIData.geometry.location.lng;
                }
                shop.Name = googlePlaceAPIData.name || shop.Name;
                shop.Address = googlePlaceAPIData.formatted_address || shop.Address;

                shop.placeDetails = {
                    name: googlePlaceAPIData.name,
                    formatted_address: googlePlaceAPIData.formatted_address,
                    rating: googlePlaceAPIData.rating,
                    user_ratings_total: googlePlaceAPIData.user_ratings_total,
                    website: googlePlaceAPIData.website,
                    business_status: googlePlaceAPIData.business_status,
                    // Store the opening_hours object. Its open_now will be from the time of this job run.
                    opening_hours: googlePlaceAPIData.opening_hours,
                    // Add other pre-fetched details as needed
                };
                
                if (shop.placeDetails.rating !== undefined) shop.Rating = shop.placeDetails.rating.toString();
                if (shop.placeDetails.website) shop.Website = shop.placeDetails.website;
            }

            if (shop.lat && shop.lng) {
                processedShops.push(shop);
            } else {
                console.warn(`[Processor] Could not determine lat/lng for shop: ${shop.Name} (ID: ${shop.GoogleProfileID}, Address: ${shop.Address}). Skipping.`);
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