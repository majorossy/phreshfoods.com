// REVISED apiService.js

async function fetchSheetData() {
  if (
    GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER ||
    !GOOGLE_SHEET_DIRECT_URL
  ) {
    console.error("ERROR: Google Sheet URL not configured.");
    return [];
  }
  try {
    const response = await fetch(DATA_FETCH_URL);
    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} from ${DATA_FETCH_URL}`
      );
    }
    const csvText = await response.text();
    return parseCSVData(csvText);
  } catch (error) {
    console.error("Could not fetch/parse Google Sheet data:", error);
    return [];
  }
}

function parseCSVData(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headerLine = lines.shift();
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

  // headerMap keys should be lowercase and match what you intend to use as shop object keys
  const headerMap = {
    name: headers.indexOf("name"),
    address: headers.indexOf("address"),
    rating: headers.indexOf("rating"),
    phone: headers.indexOf("phone"),
    website: headers.indexOf("website"),
    googleprofileid: headers.indexOf("place id"), // key is lowercase
    logo: headers.indexOf("logo"),
    imageone: headers.indexOf("image_one"),     // key is lowercase
    imagetwo: headers.indexOf("image_two"),     // key is lowercase
    imagethree: headers.indexOf("image_three"),   // key is lowercase
    twitterhandle: headers.indexOf("twitter"),  // key is lowercase
    facebookpageid: headers.indexOf("facebook"),// key is lowercase
    instagramusername: headers.indexOf("instagram username"),
    instagramembedcode: headers.indexOf("instagram embed code"),
    instagramlink: headers.indexOf("instagram"),
    beef: headers.indexOf("beef"),
    pork: headers.indexOf("pork"),
    lamb: headers.indexOf("lamb"),
    chicken: headers.indexOf("chicken"),
    turkey: headers.indexOf("turkey"),
    duck: headers.indexOf("duck"),
    eggs: headers.indexOf("eggs"),
    corn: headers.indexOf("corn"),
    carrots: headers.indexOf("carrots"),
    garlic: headers.indexOf("garlic"),
    onions: headers.indexOf("onions"),
    potatoes: headers.indexOf("potatoes"),
    lettus: headers.indexOf("lettus"),
    spinach: headers.indexOf("spinach"),
    squash: headers.indexOf("squash"),
    tomatoes: headers.indexOf("tomatoes"),
    peppers: headers.indexOf("peppers"),
    cucumbers: headers.indexOf("cucumbers"),
    zucchini: headers.indexOf("zucchini"),
    strawberries: headers.indexOf("strawberries"),
    blueberries: headers.indexOf("blueberries"),    
  };

  return lines
    .map((line, lineIndex) => {
      if (!line.trim()) return null;
      const rawValues = parseCSVLine(line);
      
      const getStringValueFromMap = (headerMapKey) => {
        const index = headerMap[headerMapKey]; // headerMapKey is already lowercase
        if (index === -1 || index === undefined || index >= rawValues.length) {
            return ""; 
        }
        let val = rawValues[index] || "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        return val.replace(/""/g, '"').trim();
      };

      // THIS IS THE KEY FUNCTION FOR PRODUCTS
      const getProductBoolean = (productHeaderMapKey) => {
          const stringVal = getStringValueFromMap(productHeaderMapKey).toLowerCase();
          return ['true', '1', 'yes', 't', 'x'].includes(stringVal);
      };
      
      const encodedEmbedCode = getStringValueFromMap("instagramembedcode");
      let decodedEmbedCode = '';
      if (encodedEmbedCode) {
        try {
          decodedEmbedCode = atob(encodedEmbedCode); 
        } catch (e) {
          console.error(`[apiService] Error decoding Instagram embed code for line ${lineIndex + 2}:`, e, `Original: ${encodedEmbedCode.substring(0,100)}`);
          decodedEmbedCode = encodedEmbedCode;
        }
      }

      const shop = {
        Name: getStringValueFromMap("name") || "N/A",
        Address: getStringValueFromMap("address") || "N/A",
        City: getStringValueFromMap("city") || "N/A",
        Zip: getStringValueFromMap("zip") || "N/A",
        Rating: getStringValueFromMap("rating") || "N/A", 
        Phone: getStringValueFromMap("phone"),
        Website: getStringValueFromMap("website"),
        GoogleProfileID: getStringValueFromMap("googleprofileid"), // Use lowercase key
        TwitterHandle: getStringValueFromMap("twitterhandle"),   // Use lowercase key
        FacebookPageID: getStringValueFromMap("facebookpageid"), // Use lowercase key
        InstagramUsername: getStringValueFromMap("instagramusername"),
        InstagramRecentPostEmbedCode: decodedEmbedCode,
        InstagramLink: getStringValueFromMap("instagramlink"),        
        ImageOne: getStringValueFromMap("imageone"),   // Use lowercase key
        ImageTwo: getStringValueFromMap("imagetwo"),   // Use lowercase key
        ImageThree: getStringValueFromMap("imagethree"), // Use lowercase key
        beef: getProductBoolean("beef"),
        pork: getProductBoolean("pork"),
        lamb: getProductBoolean("lamb"),
        chicken: getProductBoolean("chicken"),
        turkey: getProductBoolean("turkey"),
        duck: getProductBoolean("duck"),
        eggs: getProductBoolean("eggs"),
        corn: getProductBoolean("corn"),
        carrots: getProductBoolean("carrots"),
        garlic: getProductBoolean("garlic"),
        onions: getProductBoolean("onions"),
        potatoes: getProductBoolean("potatoes"),
        lettus: getProductBoolean("lettus"),
        spinach: getProductBoolean("spinach"),
        squash: getProductBoolean("squash"),
        tomatoes: getProductBoolean("tomatoes"),
        peppers: getProductBoolean("peppers"),
        cucumbers: getProductBoolean("cucumbers"),
        zucchini: getProductBoolean("zucchini"),
        strawberries: getProductBoolean("strawberries"),
        blueberries: getProductBoolean("blueberries"),
      };
      
      // console.log(`[apiService] Shop: ${shop.Name}, Beef: ${shop.beef} (Type: ${typeof shop.beef}), Corn: ${shop.corn}`);

      if (shop.Address && shop.Address !== "N/A") {
        const addressParts = shop.Address.split(",");
        if (addressParts.length >= 2) {
          let cityCandidate = addressParts[addressParts.length - 2]?.trim();
          if (cityCandidate && !/^\d{5}(-\d{4})?$/.test(cityCandidate) && !/^[A-Z]{2}$/.test(cityCandidate.toUpperCase())) {
            shop.City = cityCandidate;
          } else if (addressParts.length >= 3) {
            cityCandidate = addressParts[addressParts.length - 3]?.trim();
            if (cityCandidate && !/^\d{5}(-\d{4})?$/.test(cityCandidate) && !/^[A-Z]{2}$/.test(cityCandidate.toUpperCase())) {
              shop.City = cityCandidate;
            }
          }
        }
      }
      return shop;
    })
    .filter(
      (shop) => shop && shop.Name && shop.Name !== "N/A" && shop.Name.trim() !== ""
    );
}