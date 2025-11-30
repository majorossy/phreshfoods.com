# Cheese Shops Feature - Setup Guide

## Overview
The cheese shops feature has been fully implemented! This document explains how to set up your Google Sheet and configure the environment to start displaying cheese shops alongside farm stands.

## Google Sheet Setup

### Required Columns (Common to All Location Types)
These columns must exist in your cheese shops Google Sheet:

| Column Name | Required | Description | Example |
|------------|----------|-------------|---------|
| `Name` | ✅ Yes | Shop name | "Maine Cheese Guild" |
| `Address` | ✅ Yes | Street address | "123 Dairy Lane" |
| `City` | ⚠️ Recommended | City name | "Portland" |
| `Zip` | ⚠️ Recommended | ZIP code | "04101" |
| `Place ID` | ⚠️ Recommended | Google Place ID (if known) | "ChIJ..." |
| `Phone` | No | Phone number | "(207) 555-0123" |
| `Website` | No | Website URL | "https://mainecheese.com" |
| `Image_One` | No | Primary image filename | "cheese_shop_1.jpg" |
| `Image_Two` | No | Secondary image filename | "cheese_shop_2.jpg" |
| `Image_Three` | No | Third image filename | "cheese_shop_3.jpg" |
| `URL` | No | Custom slug for URLs | "maine-cheese-guild" |
| `Rating` | No | Manual rating (1-5) | "4.5" |
| `X` | No | Twitter/X handle | "@mainecheese" |
| `Facebook` | No | Facebook page ID | "mainecheeseguild" |
| `Instagram Username` | No | Instagram username | "mainecheeseguild" |
| `Instagram` | No | Instagram profile URL | "https://instagram.com/..." |

### Cheese-Specific Product Columns
Add these columns for cheese types and milk sources. Use "TRUE", "1", "X", or "Available" to indicate the shop carries that product:

**Cheese Types:**
- `cheddar` - Cheddar cheese
- `brie` - Brie cheese
- `gouda` - Gouda cheese
- `mozzarella` - Mozzarella cheese
- `feta` - Feta cheese
- `blue_cheese` - Blue cheese varieties
- `parmesan` - Parmesan cheese
- `swiss` - Swiss cheese
- `provolone` - Provolone cheese

**Milk Sources:**
- `cow_milk` - Made from cow's milk
- `goat_milk` - Made from goat's milk
- `sheep_milk` - Made from sheep's milk

### Example Sheet Structure
```
Name              | Address          | City     | Zip   | cheddar | brie | cow_milk | goat_milk
Maine Cheese Shop | 123 Dairy Lane   | Portland | 04101 | TRUE    | TRUE | TRUE     | FALSE
Coastal Creamery  | 456 Ocean Ave    | Camden   | 04843 | TRUE    | FALSE| TRUE     | TRUE
```

## Environment Configuration

### 1. Publish Your Google Sheet as CSV
1. Open your cheese shops Google Sheet
2. Go to **File → Share → Publish to web**
3. Choose **"Comma-separated values (.csv)"** format
4. Click **Publish**
5. Copy the published URL (should look like: `https://docs.google.com/spreadsheets/d/.../pub?output=csv`)

### 2. Update .env File
Add the cheese shop sheet URL to your `.env` file:

```env
# Existing farm stands sheet
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_FARM_STANDS_ID/pub?output=csv

# NEW: Cheese shops sheet
GOOGLE_SHEET_URL_CHEESE_SHOPS=https://docs.google.com/spreadsheets/d/YOUR_CHEESE_SHOPS_ID/pub?output=csv
```

## Testing the Implementation

### 1. Process the Data
Run the data processor to fetch and geocode your cheese shop data:

```bash
npm run process-data
```

This will:
- Fetch both Google Sheets (farm stands + cheese shops)
- Geocode all addresses
- Enrich with Google Place Details
- Generate two data files:
  - `backend/data/farmStandsData.json`
  - `backend/data/cheeseShopsData.json`

### 2. Start the Development Server
```bash
npm run dev:full
```

### 3. Verify in the Browser
Open http://localhost:5173 and check:

- ✅ **Location Type Filters** appear at the top of the filters panel
- ✅ **Product filters** change when toggling location types:
  - Farm Stands selected → Shows farm products (beef, pork, vegetables, etc.)
  - Cheese Shops selected → Shows cheese products (cheddar, brie, milk sources)
  - Both selected → Shows all products
- ✅ **Shop cards** display type badges:
  - Green "Farm" badge for farm stands
  - Yellow "Cheese" badge for cheese shops
- ✅ **URL routing** works:
  - Farm stands use `/farm/slug-name`
  - Cheese shops use `/cheese/slug-name`

## Troubleshooting

### Data Not Appearing
1. **Check console for errors** during data processing
2. **Verify column names** match exactly (case-insensitive, but must match)
3. **Check Google Sheet permissions** - must be published publicly
4. **Verify environment variable** is set correctly

### Geocoding Failures
- **Ensure addresses are complete** with city and state
- **Check API key quotas** in Google Cloud Console
- **Review backend logs** for specific geocoding errors

### Type Errors in TypeScript
If you see TypeScript errors after updating:
1. **Restart your dev server** (`npm run dev:full`)
2. **Check that all imports** are using the new context names
3. **Verify `.products` access** - products are now nested (e.g., `shop.products.cheddar` not `shop.cheddar`)

## Data Model Changes

### Before (Old Structure)
```typescript
interface Shop {
  Name: string;
  beef?: boolean;  // Direct properties
  pork?: boolean;
  // ...
}
```

### After (New Structure)
```typescript
type Shop = FarmStand | CheeseShop;

interface FarmStand {
  type: 'farm_stand';
  Name: string;
  products: {
    beef?: boolean;
    pork?: boolean;
    // ...
  };
}

interface CheeseShop {
  type: 'cheese_shop';
  Name: string;
  products: {
    cheddar?: boolean;
    brie?: boolean;
    cow_milk?: boolean;
    // ...
  };
}
```

## API Endpoints

The backend now provides:

- **`/api/locations`** - Returns ALL locations (farms + cheese shops + all other types)
- Includes caching and ETag support

## Next Steps

### 1. Add Cheese Shop Data
- Populate your Google Sheet with cheese shop information
- Include at least 3-5 locations for testing

### 2. Customize Cheese Icons (Optional)
Add custom icons for cheese products in `public/images/icons/`:
- `cheddar_1.jpg` / `cheddar_0.jpg`
- `brie_1.jpg` / `brie_0.jpg`
- etc.

If icons are missing, the filter will still work but won't show icons.

### 3. Adjust Styling (Optional)
Update colors/badges in `ShopCard.tsx` to match your branding:
- Currently: Green for farms, Yellow for cheese
- Edit lines 109-111 in `ShopCard.tsx`

### 4. Add More Location Types (Future)
The architecture supports adding more types! To add a new type:
1. Add to `LocationType` in `types/shop.ts`
2. Create product config in `config/`
3. Add to `PRODUCT_CONFIGS` registry
4. Update Google Sheet with new columns
5. No backend changes needed!

## Architecture Benefits

✅ **Type Safety** - Discriminated unions prevent accessing wrong products
✅ **Extensible** - Easy to add breweries, bakeries, etc.
✅ **Performance** - Only re-renders when relevant data changes
✅ **Backward Compatible** - Existing code continues to work
✅ **SEO Friendly** - Separate URLs for each type

## Questions?

Refer to the main `CLAUDE.md` for:
- Overall project structure
- Development commands
- Troubleshooting common issues
