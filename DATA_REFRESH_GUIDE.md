# Data Refresh Guide

## Overview

To **reduce Google API costs by ~95%**, automatic data refresh is **DISABLED by default**.

Location data (farm stands, cheese shops, fish mongers, butchers, antique shops, breweries, wineries, sugar shacks) should be refreshed manually when you update your Google Sheets.

## When to Refresh Data

Refresh location data when you:
- ✅ Add new locations to Google Sheets
- ✅ Update existing location details (address, phone, website, etc.)
- ✅ Remove/close locations
- ✅ Change product availability
- ✅ Want to pull latest Google data (ratings, reviews, opening hours)

You typically **DON'T need to refresh** for:
- ❌ Daily operations (data rarely changes)
- ❌ Minor tweaks to the frontend
- ❌ Testing changes

## How to Refresh Data

### Manual Refresh (Recommended)

**Refresh all location types:**
```bash
npm run process-data
```

**Refresh specific location type only:**
```bash
# Farm stands only
npm run process-data:farms

# Cheese shops only
npm run process-data:cheese

# Fish mongers only
npm run process-data:fish

# Butchers only
npm run process-data:butchers

# Antique shops only
npm run process-data:antiques

# Breweries only
npm run process-data:breweries

# Wineries only
npm run process-data:wineries

# Sugar shacks only
npm run process-data:sugar-shacks

# Or use the --type flag directly:
npm run process-data -- --type=farms
```

This will:
1. Fetch latest data from specified Google Sheet(s)
2. **Detect changes** - unchanged locations are cached (saves API calls!)
3. Update only changed/new locations via Google APIs
4. Show you cost savings summary

**Example output:**
```
========================================
[Processor] ✅ Successfully processed 19 farm_stand locations
[Processor] 💰 API Calls Made: 2
[Processor] 💚 API Calls Skipped (cached): 36
[Processor] 📊 Cost Savings: 95%
[Processor] 📁 Saved to: backend/data/farmStandsData.json
========================================
```

### Re-enabling Automatic Refresh (Optional)

If you want automatic updates, edit `.env`:

```bash
# Weekly refresh (Sunday at 2 AM)
DATA_REFRESH_SCHEDULE=0 2 * * 0

# Or monthly (1st of month at 2 AM)
DATA_REFRESH_SCHEDULE=0 2 1 * *
```

Then restart your server.

## Cost Comparison

| Refresh Frequency | Monthly API Calls | Estimated Cost |
|-------------------|-------------------|----------------|
| **Manual only** (recommended) | ~500-2,000 | **$0.50-$2** |
| Hourly (old default) | ~260,000 | $26-$30 |
| Weekly | ~10,000 | $2-$4 |
| Monthly | ~2,500 | $1-$2 |

## Change Detection

The data processor automatically detects THREE types of changes:

### 1. No Changes
- **Symbol:** ✓
- **Action:** Reuses all cached data
- **API Calls:** 0 (saves 2-3 calls per location)
- **Example:** Location unchanged in Google Sheets

### 2. Product Changes Only
- **Symbol:** 📦
- **Action:** Updates product availability without calling Google APIs
- **API Calls:** 0 (saves 2-3 calls per location)
- **Triggers when:** beef, pork, eggs, cheese, etc. availability changes
- **Does NOT trigger when:** name, address, phone, website unchanged

### 3. Location Information Changes
- **Symbol:** ⚠ (existing) or ⭐ (new)
- **Action:** Fetches fresh data from Google APIs
- **API Calls:** 2-3 per location (geocoding + place details)
- **Triggers when:** name, address, city, zip, phone, website, or Google Profile ID changes

## What This Means for Costs

**Updating product availability is FREE** - no API calls!

Example scenarios:
- ✅ Add "beef" to 10 farms → **0 API calls** (product-only update)
- ✅ Change 5 farms' phone numbers → **10-15 API calls** (location update)
- ✅ Add 3 new farms → **6-9 API calls** (new locations)

This means even if you run `npm run process-data` frequently, you'll only pay for actual location changes.

## Workflow Recommendation

### Option A: Update All Types
1. **Update Google Sheets** (any/all location types)
2. **Run** `npm run process-data`
3. **Check the output** to see how many API calls were made
4. **Restart server** if running (data is loaded on startup)

### Option B: Update Single Type (Faster)
1. **Update Google Sheets** for one location type (e.g., just farms)
2. **Run** `npm run process-data:farms` (or cheese, fish, butchers, antiques)
3. **Check the output** - much faster than processing all types!
4. **Restart server** if running

**Pro tip:** If you only updated the farms sheet, use `npm run process-data:farms` to save time!

## Troubleshooting

**Q: Data not updating on the website?**
- Make sure you restarted the server after running `npm run process-data`
- Check that JSON files exist in `backend/data/` directory

**Q: Too many API calls being made?**
- Check if locations actually changed in Google Sheets
- Verify change detection is working (look for "No changes detected" messages)

**Q: Want to force refresh all locations?**
- Delete the JSON files in `backend/data/` and run `npm run process-data`
- This will treat all locations as "new" and fetch fresh data

## API Key Security

Make sure your `GOOGLE_API_KEY_BACKEND` in `.env` is:
- ✅ Restricted by IP address in Google Cloud Console
- ✅ Only has necessary APIs enabled (Geocoding, Places, Directions)
- ✅ Has usage quotas set to prevent unexpected bills
