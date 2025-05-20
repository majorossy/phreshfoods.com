// js/apiService.js

async function fetchSheetData() {
  if (
    GOOGLE_SHEET_DIRECT_URL === URL_NOT_CONFIGURED_PLACEHOLDER ||
    !GOOGLE_SHEET_DIRECT_URL
  ) {
    console.error("ERROR: Google Sheet URL not configured.");
    // Handle UI update for error in main.js or uiLogic.js
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
    // Handle UI update for error in main.js or uiLogic.js
    return [];
  }
}

function parseCSVData(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headerLine = lines.shift();
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

  const headerMap = {
    name: headers.indexOf("name"),
    address: headers.indexOf("address"),
    rating: headers.indexOf("rating"),
    phone: headers.indexOf("phone"),
    website: headers.indexOf("website"),
    googleProfileId: headers.indexOf("place id"),
    logo: headers.indexOf("logo"),
    imageOne: headers.indexOf("image_one"),
    imageTwo: headers.indexOf("image_two"),
    imageThree: headers.indexOf("image_three"),
    twitterHandle: headers.indexOf("twitter"),
    facebookPageId: headers.indexOf("facebook"),
    instagram: headers.indexOf("instagram"),
  };

  Object.keys(headerMap).forEach((key) => {
    if (headerMap[key] === -1 && ["name", "address"].includes(key)) {
      // Only warn for essential missing headers
      console.warn(`Warning: Essential CSV Header "${key}" not found.`);
    } else if (headerMap[key] === -1) {
      // console.log(`Info: Optional CSV Header "${key}" not found.`);
    }
  });

  return lines
    .map((line) => {
      if (!line.trim()) return null;
      const rawValues = parseCSVLine(line);
      const getValue = (index) => {
        let val = rawValues[index] || "";
        if (val.startsWith('"') && val.endsWith('"'))
          val = val.substring(1, val.length - 1);
        return val.replace(/""/g, '"').trim();
      };

      const shop = {
        Name: getValue(headerMap.name) || "N/A",
        Address: getValue(headerMap.address) || "N/A",
        Rating: getValue(headerMap.rating) || "N/A",
        Phone: getValue(headerMap.phone),
        Website: getValue(headerMap.website),
        GoogleProfileID: getValue(headerMap.googleProfileId),
        TwitterHandle: getValue(headerMap.twitterHandle),
        FacebookPageID: getValue(headerMap.facebookPageId),
        Instagram: getValue(headerMap.instagram), // For direct link
        City: "",
        ImageOne: getValue(headerMap.imageOne),
        ImageTwo: getValue(headerMap.imageTwo),
        ImageThree: getValue(headerMap.imageThree),
      };

      if (shop.Address && shop.Address !== "N/A") {
        const addressParts = shop.Address.split(",");
        if (addressParts.length >= 2) {
          let cityCandidate = addressParts[addressParts.length - 2]?.trim();
          if (
            cityCandidate &&
            !/^\d{5}(-\d{4})?$/.test(cityCandidate) &&
            !/^[A-Z]{2}$/.test(cityCandidate.toUpperCase())
          ) {
            shop.City = cityCandidate;
          } else if (addressParts.length >= 3) {
            cityCandidate = addressParts[addressParts.length - 3]?.trim();
            if (
              cityCandidate &&
              !/^\d{5}(-\d{4})?$/.test(cityCandidate) &&
              !/^[A-Z]{2}$/.test(cityCandidate.toUpperCase())
            ) {
              shop.City = cityCandidate;
            }
          }
        }
      }
      return shop;
    })
    .filter(
      (shop) =>
        shop && shop.Name && shop.Name !== "N/A" && shop.Name.trim() !== ""
    );
}
