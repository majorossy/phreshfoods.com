'use strict';

async function fetchSheetData() {
    // Safely access AppState and its dom property, assuming AppState.js has loaded.
    const dom = window.AppState?.dom;

    // Check if the Google Sheet URL is configured.
    if (
        GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER ||
        !GOOGLE_SHEET_DIRECT_URL
    ) {
        console.error("apiService.js: Google Sheet URL is not configured.");
        if (dom?.noResultsDiv) { // Check if the DOM element for messages exists
            dom.noResultsDiv.textContent = "Data source is not configured. Please contact the site administrator.";
            dom.noResultsDiv.classList.remove('hidden');
            if (dom.listingsContainer) dom.listingsContainer.classList.add('hidden'); // Hide list area
        }
        return []; // Return empty array to prevent errors in downstream processing
    }

    try {
        const response = await fetch(DATA_FETCH_URL); // DATA_FETCH_URL from config.js
        if (!response.ok) {
            // Log details for debugging, show generic error to user.
            console.error(`apiService.js: HTTP error! Status: ${response.status}, URL: ${DATA_FETCH_URL}`);
            throw new Error(`Failed to fetch data. Status: ${response.status}`);
        }
        const csvText = await response.text();

        if (!csvText || csvText.trim() === "") {
            console.warn("apiService.js: Fetched CSV data is empty or whitespace only.");
             if (dom?.noResultsDiv) {
                dom.noResultsDiv.textContent = "No data received from the source. The farm stand list may be temporarily unavailable or empty.";
                dom.noResultsDiv.classList.remove('hidden');
                if (dom.listingsContainer) dom.listingsContainer.classList.add('hidden');
            }
            return [];
        }
        return parseCSVData(csvText); // parseCSVData is defined below in this file
    } catch (error) {
        console.error("apiService.js: Could not fetch or parse Google Sheet data.", error.message);
        if (dom?.noResultsDiv) {
            dom.noResultsDiv.textContent = "Could not load farm stand data. Please check your internet connection and try again. If the problem persists, please contact support.";
            dom.noResultsDiv.classList.remove('hidden');
            if (dom.listingsContainer) dom.listingsContainer.classList.add('hidden');
        }
        return []; // Critical failure, return empty
    }
}

function parseCSVData(csv) {
    const lines = csv.trim().split(/\r?\n/); // Split into lines, handling different line endings
    if (lines.length < 2) { // Must have at least a header and one data line
        console.warn("parseCSVData: CSV data has insufficient lines (header only or empty).");
        return [];
    }
    const headerLine = lines.shift(); // Get and remove the header line
    const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase()); // parseCSVLine from utils.js

    // Define mapping from expected object keys to CSV header names (all lowercase)
    const headerMap = {
        name: headers.indexOf("name"),
        address: headers.indexOf("address"),
        city: headers.indexOf("city"), // Check if CSV has this directly
        zip: headers.indexOf("zip"),   // Check if CSV has this directly
        rating: headers.indexOf("rating"), // From CSV, Places API rating usually preferred
        phone: headers.indexOf("phone"),
        website: headers.indexOf("website"),
        googleprofileid: headers.indexOf("place id"),
        logo: headers.indexOf("logo"), // Note: Not currently used in the UI rendering
        imageone: headers.indexOf("image_one"),
        imagetwo: headers.indexOf("image_two"),
        imagethree: headers.indexOf("image_three"),
        twitterhandle: headers.indexOf("twitter"),
        facebookpageid: headers.indexOf("facebook"),
        instagramusername: headers.indexOf("instagram username"),
        instagramembedcode: headers.indexOf("instagram embed code"),
        instagramlink: headers.indexOf("instagram"),
        beef: headers.indexOf("beef"), pork: headers.indexOf("pork"), lamb: headers.indexOf("lamb"),
        chicken: headers.indexOf("chicken"), turkey: headers.indexOf("turkey"), duck: headers.indexOf("duck"),
        eggs: headers.indexOf("eggs"), corn: headers.indexOf("corn"), carrots: headers.indexOf("carrots"),
        garlic: headers.indexOf("garlic"), onions: headers.indexOf("onions"), potatoes: headers.indexOf("potatoes"),
        lettus: headers.indexOf("lettus"), spinach: headers.indexOf("spinach"), squash: headers.indexOf("squash"),
        tomatoes: headers.indexOf("tomatoes"), peppers: headers.indexOf("peppers"), cucumbers: headers.indexOf("cucumbers"),
        zucchini: headers.indexOf("zucchini"), strawberries: headers.indexOf("strawberries"), blueberries: headers.indexOf("blueberries"),
    };

    return lines
        .map((line, lineIndex) => {
            if (!line.trim()) return null; // Skip completely empty lines
            const rawValues = parseCSVLine(line); // From utils.js

            const getStringValue = (key) => {
                const index = headerMap[key];
                if (index === -1 || index === undefined || index >= rawValues.length) return ""; // Header not found or out of bounds
                let val = rawValues[index] || ""; // Default to empty string if value is null/undefined
                // CSV spec: if a field is quoted, internal quotes are doubled. "" -> "
                // parseCSVLine handles basic quotes; this reinforces for internal escaped quotes if parseCSVLine isn't perfect
                // However, a good parseCSVLine should handle this. Relying on getStringValue to re-process quotes is a fallback.
                // Standard CSV parsing often removes outer quotes already.
                // If val is already unquoted:
                // if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
                // return val.replace(/""/g, '"').trim(); // Ensure this doesn't mess up already parsed fields. parseCSVLine from utils should handle it.
                return val; // parseCSVLine already trims and should handle quotes.
            };

            const getProductBoolean = (key) => {
                const val = getStringValue(key).trim().toLowerCase();
                return ['true', '1', 'yes', 't', 'x', 'available'].includes(val); // Added 'available' as a common marker
            };

            const encodedEmbed = getStringValue("instagramembedcode");
            let decodedEmbed = '';
            if (encodedEmbed) {
                try {
                    decodedEmbed = atob(encodedEmbed);
                } catch (e) {
                    console.warn(`apiService: Error decoding Instagram embed for CSV line ${lineIndex + 2}: ${e.message}. Original code: ${encodedEmbed.substring(0,50)}...`);
                    decodedEmbed = "<!-- Invalid Instagram Embed Code -->"; // Provide a clear placeholder
                }
            }

            const shop = {
                Name: getStringValue("name") || "Farm Stand (Name Missing)", // Provide a fallback if name is critical
                Address: getStringValue("address") || "N/A",
                City: getStringValue("city") || "N/A", // Prioritize direct column
                Zip: getStringValue("zip") || "N/A",   // Prioritize direct column
                Rating: getStringValue("rating") || "N/A", // This is from CSV
                Phone: getStringValue("phone"),
                Website: getStringValue("website"),
                GoogleProfileID: getStringValue("googleprofileid"),
                TwitterHandle: getStringValue("twitterhandle"),
                FacebookPageID: getStringValue("facebookpageid"),
                InstagramUsername: getStringValue("instagramusername"),
                InstagramRecentPostEmbedCode: decodedEmbed,
                InstagramLink: getStringValue("instagramlink"),
                ImageOne: getStringValue("imageone"),
                ImageTwo: getStringValue("imagetwo"),
                ImageThree: getStringValue("imagethree"),

                // Product Attributes
                beef: getProductBoolean("beef"), pork: getProductBoolean("pork"), lamb: getProductBoolean("lamb"),
                chicken: getProductBoolean("chicken"), turkey: getProductBoolean("turkey"), duck: getProductBoolean("duck"),
                eggs: getProductBoolean("eggs"), corn: getProductBoolean("corn"), carrots: getProductBoolean("carrots"),
                garlic: getProductBoolean("garlic"), onions: getProductBoolean("onions"), potatoes: getProductBoolean("potatoes"),
                lettus: getProductBoolean("lettus"), spinach: getProductBoolean("spinach"), squash: getProductBoolean("squash"),
                tomatoes: getProductBoolean("tomatoes"), peppers: getProductBoolean("peppers"), cucumbers: getProductBoolean("cucumbers"),
                zucchini: getProductBoolean("zucchini"), strawberries: getProductBoolean("strawberries"), blueberries: getProductBoolean("blueberries"),

                // Properties to be populated later (important for consistency)
                placeDetails: null, // For Google Places API details caching
                lat: null,
                lng: null,
                distance: null,     // Calculated relative to a search point
                marker: null,       // For the Google Maps marker object
                _isFetchingCardDetails: false, // Internal flag for Places API calls
            };

            // Fallback: Parse City/Zip from Address if not directly provided in CSV and Address exists
            if ((shop.City === "N/A" || !shop.City.trim()) && shop.Address && shop.Address !== "N/A") {
                const addressParts = shop.Address.split(",");
                if (addressParts.length >= 3) { // Assumes format like: Street, City, State ZIP
                    let cityCandidate = addressParts[addressParts.length - 2]?.trim();
                    // Avoid mistaking state abbreviations (e.g., "ME") or pure numbers for city
                    if (cityCandidate && !/^[A-Z]{2}$/.test(cityCandidate.toUpperCase()) && !/^\d+$/.test(cityCandidate)) {
                        shop.City = cityCandidate;
                    }
                }
                // More sophisticated address parsing could be added here if needed
            }
            if ((shop.Zip === "N/A" || !shop.Zip.trim()) && shop.Address && shop.Address !== "N/A") {
                const zipMatch = shop.Address.match(/\b\d{5}(?:-\d{4})?\b\s*$/); // Matches ZIP or ZIP+4 at the very end of the string
                if (zipMatch) {
                    shop.Zip = zipMatch[0].trim();
                }
            }

            return shop;
        })
        .filter(shop => shop && shop.Name && shop.Name.trim() !== "" && shop.Name !== "N/A" && shop.Name !== "Farm Stand (Name Missing)");
}