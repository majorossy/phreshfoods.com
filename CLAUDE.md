# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

phind.us is a multi-location-type finder application for Maine. It's a React + TypeScript + Vite frontend with a Node.js/Express backend that fetches location data from Google Sheets, enriches it with Google Maps API data (geocoding, place details), and serves it to the frontend.

**Supported Location Types (8 total):**
- Farm Stands (original focus)
- Cheesemongers
- Fishmongers
- Butchers
- Antiques
- Breweries *(feature-flagged)*
- Wineries *(feature-flagged)*
- Sugar Shacks *(feature-flagged)*

Each location type has its own product configuration and filtering system. The last 3 types can be enabled/disabled via environment variables (see Feature Flags section).

## Development Commands

### Starting the Application

**Full stack development:**
```bash
npm run dev:full
# Runs both frontend (Vite dev server on port 5173) and backend (Express on port 3000) in parallel
```

**Frontend only:**
```bash
npm run dev
# Vite dev server with HMR
```

**Backend only:**
```bash
npm run start:backend
# or: node backend/server.js
```

### Building

**Build frontend:**
```bash
npm run build:frontend
# Runs TypeScript compiler check and Vite build
```

**Build full project:**
```bash
npm run build
# Builds both frontend and backend (backend has no build step currently)
```

### Linting & Code Quality

```bash
npm run lint              # ESLint with TypeScript support
npm run typecheck         # Type check without building
npm run typecheck:watch   # Type check in watch mode
npm run check:all         # Run typecheck, lint, and tests
npm run check:deps        # Check for outdated dependencies
npm run check:security    # Run npm security audit
```

### Performance Analysis

```bash
npm run analyze           # Generate bundle size visualization (dist/stats.html)
npm run build:analyze     # Build and analyze
npm run test:lighthouse   # Run Lighthouse performance audit
npm run dev:debug        # Run with DEBUG output
```

### Maintenance Scripts

```bash
npm run clean            # Full reset (remove node_modules, dist, data)
npm run clean:cache      # Clear build caches only
npm run optimize-images  # Generate WebP versions of images
```

### Data Processing

**⚠️ IMPORTANT: Automatic refresh is DISABLED by default to reduce API costs by ~95%**

**Manually refresh location data (recommended workflow):**
```bash
# Refresh all location types
npm run process-data

# Or refresh specific types only (faster):
npm run process-data:farms
npm run process-data:cheese
npm run process-data:fish
npm run process-data:butchers
npm run process-data:antiques
npm run process-data:breweries
npm run process-data:wineries
npm run process-data:sugar-shacks

# Or use the --type flag:
npm run process-data -- --type=farms
```

Features:
- Fetches Google Sheet data, geocodes addresses, enriches with Place Details
- Uses change detection - only updates locations that have actually changed
- Shows cost savings summary after completion
- Can update specific location types to save time

**See [DATA_REFRESH_GUIDE.md](./docs/DATA_REFRESH_GUIDE.md) for complete documentation.**

## Architecture

### Frontend (React + TypeScript + Vite)

**Location:** `src/`

**Key directories:**
- `src/components/` - React components organized by feature
  - `Filters/` - Product filtering UI
  - `Header/` - Top navigation and search
  - `Listings/` - Shop cards and listings panel
  - `Map/` - Google Maps integration
  - `Overlays/` - Modal overlays for shop details, social info, directions
  - `UI/` - Reusable UI components
  - `ErrorBoundary/` - Error boundary for catching component errors
- `src/contexts/` - React Context for global state (domain-driven architecture)
  - `AppProviders.tsx` - Composite provider wrapping all domain contexts
  - `LocationDataContext.tsx` - All location data & loading states (primary data context)
  - `SearchContext.tsx` - Location search & radius
  - `FilterContext.tsx` - Product filtering & location type filtering
  - `UIContext.tsx` - UI state (overlays, modals, selected shop)
  - `DirectionsContext.tsx` - Google Maps directions
  - `ToastContext.tsx` - Toast notifications
  - `TripPlannerContext.tsx` - Trip planning with multi-stop routes
  - `FarmDataContext.tsx` - Legacy alias (backwards compatibility)
- `src/hooks/` - Custom React hooks
- `src/services/` - API service layer (apiService.ts)
- `src/types/` - TypeScript type definitions
- `src/config/` - App configuration and product definitions
  - `appConfig.ts` - App constants (map center, zoom, delays, marker styling)
  - `productRegistry.ts` - Central registry mapping location types to product configs
  - `enabledLocationTypes.ts` - Feature flags for location types
  - `farmProducts.ts` - Farm stand products (22 products)
  - `cheeseProducts.ts` - Cheese shop products (12 products)
  - `fishProducts.ts` - Fish monger products (12 products)
  - `butcherProducts.ts` - Butcher shop products (12 products)
  - `antiqueProducts.ts` - Antique shop products (10 products)
  - `breweryProducts.ts` - Brewery products (9 products)
  - `wineryProducts.ts` - Winery products (10 products)
  - `sugarShackProducts.ts` - Sugar shack products (6 products)
- `src/utils/` - Utility functions (cookie helpers, SEO, etc.)

**State Management:**
- **Domain-Driven Context Architecture:** State is split into focused, single-responsibility contexts
- **Migration Status:** Components are being migrated from legacy `AppContext` to specific domain hooks
- **See:** `src/contexts/CONTEXTS.md` for comprehensive documentation

**Domain Contexts (7 total):**

1. **LocationDataContext** (`useLocationData()`)
   - `allLocations` - All locations fetched from backend (all 8 types combined)
   - `currentlyDisplayedLocations` - Filtered/sorted locations with distance calculations
   - `isLoadingLocations` - Loading state
   - `locationsError` - Error message if loading failed
   - `retryLoadLocations()` - Retry function for failed loads
   - **Note:** `useFarmData()` is exported as a backwards-compatible alias

2. **SearchContext** (`useSearch()`)
   - `lastPlaceSelectedByAutocomplete` - Search location from Google Places autocomplete
   - `searchTerm` - Current search input
   - `currentRadius` - Search radius in miles
   - `mapsApiReady` - Google Maps API loaded state
   - `mapViewTargetLocation` - Location to center map on

3. **FilterContext** (`useFilters()`)
   - `activeProductFilters` - User's selected product filters
   - `activeLocationTypes` - User's selected location types (farm_stand, cheese_shop, etc.)

4. **UIContext** (`useUI()`)
   - `selectedShop` - Currently selected shop for detail view
   - `hoveredShop` - Shop being hovered for map preview
   - `isShopOverlayOpen` - Shop details overlay state
   - `isSocialOverlayOpen` - Social/directions overlay state
   - `isFilterDrawerOpen` - Filter drawer state (mobile)
   - `isInitialModalOpen` - Initial search modal state

5. **DirectionsContext** (`useDirections()`)
   - `directionsResult` - Google Maps directions data
   - `directionsError` - Error message
   - `isFetchingDirections` - Loading state

6. **ToastContext** (`useToast()`)
   - `showToast()` - Display success/info notifications
   - `showError()` - Display error notifications
   - `showWarning()` - Display warning notifications

7. **TripPlannerContext** (`useTripPlanner()`)
   - `tripStops` - Array of shops in the trip
   - `isTripMode` - Trip planning mode toggle
   - `tripDirectionsResult` - Multi-stop directions from Google
   - `isOptimizedRoute` - Whether route has been optimized
   - **Features:** URL encoding for sharing, localStorage persistence, drag-to-reorder

**Performance Benefits:**
- Components using specific hooks only re-render when their domain changes
- Reduces unnecessary re-renders compared to monolithic AppContext
- Better code organization and maintainability

**Routing:**
- Uses React Router v6
- Two routes: `/` (home) and `/farm/:slug` (shop detail view)
- Navigation tied to overlay state - opening an overlay updates URL

### Backend (Node.js + Express)

**Location:** `backend/`

**Key files:**
- `server.js` - Express server with API endpoints
- `processSheetData.js` - Data processor that fetches Google Sheets, geocodes, and enriches data for all location types
- `cacheService.js` - In-memory caching (node-cache) for Google API responses
- `data/` - Generated JSON files for each location type (gitignored)
  - `farmStandsData.json` - Farm stand locations
  - `cheeseShopsData.json` - Cheese shop locations
  - `fishMongersData.json` - Fish monger locations
  - `butchersData.json` - Butcher shop locations
  - `antiqueShopsData.json` - Antique shop locations
  - `breweriesData.json` - Brewery locations *(feature-flagged)*
  - `wineriesData.json` - Winery locations *(feature-flagged)*
  - `sugarShacksData.json` - Sugar shack locations *(feature-flagged)*
  - `.gitkeep` - Placeholder to maintain directory structure in git

**Data Flow:**
1. **Manual refresh (recommended):** Run `npm run process-data` when you update Google Sheets
2. **Optional scheduled refresh:** Disabled by default (set `DATA_REFRESH_SCHEDULE` in .env to enable)
3. **processSheetData.js:**
   - Fetches CSV from multiple Google Sheet tabs (via `GOOGLE_SHEET_URL_*` env vars)
   - Processes 8 location types: farm stands, cheese shops, fish mongers, butchers, antique shops, breweries, wineries, sugar shacks
   - **Change detection:** Compares location data hash - only updates changed/new locations
   - For changed/new locations: geocodes address, fetches Place Details
   - Saves enriched data to separate JSON files in `backend/data/`
   - Has 500ms delay between API calls (`DELAY_BETWEEN_API_CALLS_MS`)
   - Shows cost savings summary (API calls made vs skipped)
   - **Important:** JSON data files are gitignored and must be generated via `npm run process-data`
3. **server.js:**
   - Serves static files from `public/`
   - Provides `/api/locations` endpoint (combines all location types from JSON files)
   - Uses `ongoingUpdate` promise tracking to prevent ECONNRESET errors when data is being processed
   - Proxies Google Maps API calls: `/api/geocode`, `/api/places/details`, `/api/directions`
   - On-demand API calls are cached via `cacheService.js`

**API Endpoints:**
- `GET /api/config` - Config endpoint (currently returns empty object)
- `GET /api/locations` - Returns all enabled locations (up to 8 types based on feature flags)
- `GET /api/geocode?address=...` - Geocode an address (proxied to Google)
- `GET /api/places/details?placeId=...&fields=...` - Get Place Details (proxied to Google)
- `GET /api/directions?origin=...&destination=...` - Get directions (proxied to Google)
- `GET /api/cache/flush-and-refresh` - Flush cache and refresh data (dev only)

### Environment Variables

**Required (backend):**
- `GOOGLE_API_KEY_BACKEND` - Google Maps API key for server-side calls
- `GOOGLE_SHEET_URL` - Farm stands CSV URL
- `GOOGLE_SHEET_URL_CHEESE_SHOPS` - Cheese shops CSV URL
- `GOOGLE_SHEET_URL_FISH_MONGERS` - Fish mongers CSV URL
- `GOOGLE_SHEET_URL_BUTCHERS` - Butchers CSV URL
- `GOOGLE_SHEET_URL_ANTIQUE_SHOPS` - Antique shops CSV URL
- `GOOGLE_SHEET_URL_BREWERIES` - Breweries CSV URL *(optional)*
- `GOOGLE_SHEET_URL_WINERIES` - Wineries CSV URL *(optional)*
- `GOOGLE_SHEET_URL_SUGAR_SHACKS` - Sugar shacks CSV URL *(optional)*
- `PORT` - Server port (default: 3000)

**Optional (backend):**
- `DATA_REFRESH_SCHEDULE` - Cron expression for data refresh (disabled by default)
- `MAX_DATA_FILE_AGE_HOURS` - Max age before data refresh (default: 4 hours)
- `NODE_ENV` - Set to 'development' to enable cache flush endpoint
- `ALLOW_CACHE_FLUSH` - Set to 'true' to enable cache flush endpoint in non-dev
- `ENABLE_BREWERIES` - Enable brewery location type (default: false)
- `ENABLE_WINERIES` - Enable winery location type (default: false)
- `ENABLE_SUGAR_SHACKS` - Enable sugar shack location type (default: false)

**Frontend feature flags (in .env):**
- `VITE_ENABLE_BREWERIES` - Enable breweries in frontend (default: false)
- `VITE_ENABLE_WINERIES` - Enable wineries in frontend (default: false)
- `VITE_ENABLE_SUGAR_SHACKS` - Enable sugar shacks in frontend (default: false)

Frontend config is in `src/config/appConfig.ts` and `src/config/enabledLocationTypes.ts`.

### Data Model

**Shop Type (src/types/shop.ts):**
- `Shop` is a discriminated union type with 8 variants (one per location type)
- `type` field identifies location type: `'farm_stand' | 'cheese_shop' | 'fish_monger' | 'butcher' | 'antique_shop' | 'brewery' | 'winery' | 'sugar_shack'`
- `LocationType` is the union type, `ALL_LOCATION_TYPES` is the constant array
- Type guards available: `isFarmStand()`, `isCheeseShop()`, `isFishMonger()`, `isButcher()`, `isAntiqueShop()`, `isBrewery()`, `isWinery()`, `isSugarShack()`

**Product interfaces (type-specific):**
- **FarmStandProducts:** 22 products (beef, pork, lamb, chicken, turkey, duck, eggs, vegetables, fruits)
- **CheeseShopProducts:** 12 products (cheddar, brie, gouda, mozzarella, feta, blue_cheese, parmesan, swiss, provolone, cow/goat/sheep_milk)
- **FishMongerProducts:** 12 products (salmon, cod, haddock, tuna, halibut, scallops, shrimp, lobster, crab, clams, oysters, mussels)
- **ButcherProducts:** 12 products (beef, pork, lamb, chicken, turkey, duck, sausages, bacon, ground_meat, steaks, roasts, chops)
- **AntiqueShopProducts:** 10 products (furniture, jewelry, art, books, ceramics, glassware, silverware, textiles, collectibles, vintage_clothing)
- **BreweryProducts:** 9 products (ipa, lager, stout, ale, pilsner, porter, wheat_beer, sour, cider)
- **WineryProducts:** 10 products (red_wine, white_wine, rose, sparkling, dessert_wine, ice_wine, cabernet, chardonnay, pinot_noir, merlot)
- **SugarShackProducts:** 6 products (maple_syrup, maple_sugar, maple_candy, maple_butter, maple_cream, pancake_mix)

**Common fields (BaseLocation):**
- From Google Sheet: Name, Address, City, Zip, Phone, Website, slug, social media fields
- Geocoded: lat, lng (nullable if geocoding fails)
- Enriched: placeDetails (rating, opening_hours, photos, reviews from Google)

**Product Configuration (src/config/productRegistry.ts):**
- Central registry maps location types → product configs
- Each product has: `csvHeader`, `name`, `icon_available`, `icon_unavailable`, `category`
- Icons stored in `/public/images/icons/` with pattern: `{product}_1.jpg` (available), `{product}_0.jpg` (unavailable)
- Total: ~93 unique products across all 8 types
- Helper functions: `getProductConfig()`, `getCategoryDisplayOrder()`, `getMergedProductConfigs()`

**ShopWithDistance:**
- Extends Shop with `distance` (meters) and `distanceText` (formatted string)

### Key Features

**Filtering & Search:**
- Location-based search with radius filtering (uses Google Maps geometry)
- Product filtering (multi-select from 20+ products grouped by category)
- Filters are applied in App.tsx useEffect, which updates `currentlyDisplayedShops`

**Google Maps Integration:**
- Uses Google Maps JavaScript API with Map ID (`6c1bbba6c5f48ca2beb388ad`)
- Advanced Marker Elements with custom styling:
  - Default markers: Red (`#ed411a`) at scale 1.2
  - Hovered markers: Blue (`#4285F4`) at scale 1.6
  - Selected markers: Blue (`#4285F4`) at scale 1.5 (maintains hover color for visual consistency)
- InfoWindow for shop preview
- Directions rendering with DirectionsService/DirectionsRenderer
- Place Autocomplete for location search

**✅ Google Places Autocomplete Migration (Completed Nov 2025):**
- Migrated from deprecated `google.maps.places.Autocomplete` to new `PlaceAutocompleteElement` Web Component
- **Implementation:** Uses `PlaceAutocomplete` reusable component (`src/components/UI/PlaceAutocomplete.tsx`)
- **Hook:** `usePlaceAutocomplete` (`src/hooks/usePlaceAutocomplete.ts`) with automatic legacy fallback
- **Files migrated:** `MapSearchControls.tsx`, `InitialSearchModal.tsx`
- **Fallback:** Automatically falls back to legacy API if `PlaceAutocompleteElement` isn't available
- Note: Legacy API deprecation warnings may still appear until Google fully enables the new Web Component for all accounts

**Map Styling & Customization:**
- **Local Custom Styling:** Map appearance is controlled via local code in `src/config/map.ts`
- **Active Theme:** "Maine License Plate" theme with Maine-inspired colors
  - Land: Green tones (#1a6a41, #288b5c, #3c7346)
  - Roads: Brown tones (#63493c)
  - Water: Dark teal (#356A78) - Maine coastal theme
  - Text: Light with dark strokes for high contrast
- **Changing Map Styles:**
  1. Edit `src/config/map.ts` → `mapStyles.maineLicensePlate` array
  2. Modify color values (e.g., change water color from #356A78 to another hex)
  3. Save the file
  4. Refresh browser (Cmd+Shift+R on Mac) to see changes
- **Water Color Specifically:** Lines 105-107 in map.ts control water appearance
- **Cloud-Based Alternative:** MAP_ID (`6c1bbba6c5f48ca2beb388ad`) is available but currently disabled
  - To use: Uncomment `mapId: MAP_ID` in MapComponent.tsx:161
  - Note: Cloud-based styling overrides all local styles when active

**Overlays:**
- **Shop Details Overlay** - Accordion interface with:
  - **Products accordion** - Type-specific product availability with icons (open by default)
  - **Information accordion** - Basic shop information (name, address, phone, website, rating)
  - **Hours accordion** - Opening hours from Google Place Details
  - Pattern: Multiple accordions can be open simultaneously
  - State management: Uses `Set<string>` to track open accordions
  - Accessibility: Full ARIA support (aria-expanded, aria-controls, aria-labelledby, role="region")
  - Animation: Smooth slide-down animation (`animate-slideDown` class, 200ms ease-out)
  - Reset behavior: Accordions reset to default state (Products open) when shop changes
  - Implementation: `src/components/Overlays/ShopDetailsOverlay.tsx`
  - Tests: `src/components/Overlays/ShopDetailsOverlay.test.tsx` (13 tests covering accordion functionality)
- **Social Overlay** - Tabbed interface for social media, reviews, and directions
- **Initial Search Modal** - First-time user experience

**State Persistence:**
- Last searched location saved in cookie (`farmStandFinder_lastLocation`)
- Cookie expires after 30 days

## Important Implementation Details

### Error Boundaries
- **ErrorBoundary component** (`src/components/ErrorBoundary/ErrorBoundary.tsx`)
- Catches JavaScript errors in child components to prevent entire app crashes
- Provides fallback UI with "Try Again" functionality
- Wrapped around major sections: Header, MapComponent, ListingsPanel
- Includes accessibility features (role="alert", aria-live="assertive")
- Shows error details in development mode

**Usage:**
```tsx
<ErrorBoundary fallback={<CustomFallback />} onError={(error, info) => logError(error)}>
  <MyComponent />
</ErrorBoundary>
```

### Accessibility (WCAG 2.1 Compliance)
- **Current Status:** ~95% WCAG 2.1 Level AA compliant
- **See:** `ACCESSIBILITY_AUDIT.md` for detailed audit report

**Key Features:**
- Skip-to-content link for keyboard navigation (App.tsx:172-177)
- ARIA roles and labels on interactive elements
- Live regions for dynamic content (alerts, loading states)
- Semantic HTML (fieldsets for form groups, legends for grouping)
- Focus management on modals and overlays
- Screen reader announcements for errors and status changes

**Recent Fixes:**
- ErrorBoundary: role="alert" for error messages
- SocialOverlay: aria-label on all tab buttons, role="status" for loading
- ProductFilters: fieldset/legend for filter groups

### Testing
- **See:** `TESTING_GUIDE.md` for setup instructions and examples
- Testing framework: Vitest + React Testing Library
- Includes examples for:
  - Testing components with context hooks
  - Testing context providers directly
  - Accessibility testing with jest-axe
  - Error boundary testing

**To set up testing:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Google API Cost Optimization & Rate Limiting

**⚠️ CRITICAL: Automatic refresh is DISABLED by default to reduce costs by ~95%**

#### Cost Optimization Strategy (2025-01)
The application implements a three-tier system to minimize Google API costs:

**1. Manual Refresh Only**
- Automatic cron refresh disabled by default
- Run `npm run process-data` only when YOU update Google Sheets
- Expected cost: **$0.50-$2/month** (vs $26-30 with hourly refresh)

**2. Intelligent Change Detection**
- **Location Hash**: Detects changes to name, address, city, zip, phone, website, Google Profile ID
- **Product Hash**: Detects changes to product availability (beef, pork, eggs, etc.)
- **Three-Tier Detection**:
  - ✓ **No changes** → Reuses all cached data (0 API calls)
  - 📦 **Product changes only** → Updates products without API calls (0 API calls)
  - ⚠ **Location changes** → Fetches from Google APIs (2-3 API calls per location)

**3. Selective Type Refresh**
- Refresh only the location type you updated
- `npm run process-data:farms` - Farm stands only
- `npm run process-data:cheese` - Cheese shops only
- `npm run process-data:fish` - Fish mongers only
- `npm run process-data:butchers` - Butchers only
- `npm run process-data:antiques` - Antique shops only
- `npm run process-data:breweries` - Breweries only
- `npm run process-data:wineries` - Wineries only
- `npm run process-data:sugar-shacks` - Sugar shacks only

**Cost Examples:**
- Update 10 product availabilities: **$0** (0 API calls)
- Add 5 new locations: **$0.10-0.15** (10-15 API calls)
- Change 3 addresses: **$0.06-0.09** (6-9 API calls)
- Full refresh with no changes: **$0** (0 API calls)

#### Rate Limiting
- Backend uses 500ms delay between API calls in processSheetData.js
- On-demand API calls (from user actions) are cached with varying TTLs:
  - Geocoding: 24 hours
  - Place Details: 6 hours (15 minutes if opening_hours requested)
  - Directions: 1 hour

**See [DATA_REFRESH_GUIDE.md](./docs/DATA_REFRESH_GUIDE.md) for complete documentation.**

### CSV Parsing
- Custom CSV parser in both server.js and processSheetData.js
- Handles quoted values, escaped quotes, commas in fields

### Distance Calculations
- Uses `google.maps.geometry.spherical.computeDistanceBetween()`
- Results sorted by distance when location search is active
- Default search radius: 20 miles (configurable in `src/config/map.ts`)
- Default location: Portland, Maine (`{ lat: 43.6591, lng: -70.2568 }`)

### Proxy Configuration
- Vite dev server proxies `/api/*` to `http://localhost:3000`
- Production: Express serves both API and static files

### TypeScript Configuration
- `tsconfig.json` - Base config
- `tsconfig.app.json` - App-specific (src/)
- `tsconfig.node.json` - Node-specific (vite.config.ts)

## Documentation Files

- **CLAUDE.md** (this file) - Project overview and development guide
- **DEPLOYMENT.md** - Comprehensive deployment guide with environment setup, build process, and production deployment instructions
- **DATA_REFRESH_GUIDE.md** - Complete data refresh workflow, change detection, and cost optimization guide
- **DATA_REFRESH_QUICK_REFERENCE.md** - Quick reference card for data refresh commands and symbols
- **CONTEXTS.md** (`src/contexts/CONTEXTS.md`) - Comprehensive context architecture documentation
- **ACCESSIBILITY_AUDIT.md** - Accessibility audit report and WCAG compliance status
- **TESTING_GUIDE.md** - Testing setup instructions and examples
- **README.md** - Basic project information

## Security

### Security Features (2025-11)

The application implements multiple security layers:

**1. HTTPS Enforcement**
- Enabled via `ENFORCE_HTTPS=true` in `.env` (production only)
- Redirects HTTP to HTTPS using `X-Forwarded-Proto` header from reverse proxy
- Implementation: `backend/server.js:56-78`

**2. Security Headers (Helmet)**
- Content Security Policy configured for Google Maps
- Cross-Origin policies for map resources
- Implementation: `backend/server.js:83-121`

**3. Rate Limiting**
| Endpoint | Production Limit | Window |
|----------|-----------------|--------|
| General `/api/*` | 100 requests | 15 min |
| `/api/geocode` | 30 requests | 15 min |
| `/api/places/details` | 30 requests | 15 min |
| `/api/directions` | 30 requests | 15 min |
| `/api/photo` | 50 requests | 15 min |

Implementation: `backend/server.js:179-218`

**4. Input Validation**
- `sanitizeInput()` - Removes XSS vectors (`<>`, `javascript:`, `data:`, event handlers)
- `validatePlaceId()` - Validates Google Place ID format (alphanumeric only)
- `validateFieldsList()` - Whitelist of 38 allowed Google Places API fields
- Waypoints validation - Validates lat/lng ranges (-90/90, -180/180)
- Photo endpoint validation - Validates `maxwidth` (1-4800) and `photo_reference` format
- Implementation: `backend/server.js:200-250`

**5. Admin Authentication**
- Tokens accepted ONLY via headers (never query parameters):
  - `Authorization: Bearer <token>` (preferred)
  - `X-Admin-Token: <token>` (alternative)
- Brute-force protection: 5 failed attempts = 15-minute IP lockout
- Failed attempts are logged with IP addresses
- Implementation: `backend/server.js:1207-1264`

**Using Admin Endpoints:**
```bash
# Preferred method (Authorization header):
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     "https://yoursite.com/api/cache/flush-and-refresh"

# Alternative (X-Admin-Token header):
curl -H "X-Admin-Token: YOUR_ADMIN_TOKEN" \
     "https://yoursite.com/api/cache/flush-and-refresh"
```

**6. CORS Configuration**
- Production: Restricted to `ALLOWED_ORIGINS` environment variable
- Development: Uses `DEV_ALLOWED_ORIGINS` or allows localhost by default
- Credentials enabled for authenticated requests
- Implementation: `backend/server.js:123-163`

### Security Best Practices

**API Key Management:**
- `.env` is gitignored - never commit secrets
- Use separate API keys for frontend and backend
- Restrict keys in Google Cloud Console:
  - Frontend key: HTTP referrer restrictions (your domain)
  - Backend key: IP address restrictions (your server)
- Rotate keys periodically and after any suspected exposure

**Environment Configuration:**
- Copy `.env.example` to `.env` for new deployments
- Generate secure admin tokens: `openssl rand -hex 32`
- Set `NODE_ENV=production` in production

**Dependency Security:**
```bash
npm run check:security  # Run npm audit
npm audit fix           # Fix vulnerabilities
```

## Recent Architectural Improvements

### Google API Cost Optimization (2025-01)
**Impact:** Reduced monthly API costs from ~$26-30 to ~$0.50-2 (95%+ savings)

**Changes:**
- **Disabled automatic hourly refresh** - Manual refresh only by default
- **Intelligent change detection** - Three-tier system (no changes, product-only, location changes)
- **Product-only updates** - Product availability changes are FREE (0 API calls)
- **Selective type refresh** - Update only farm stands, cheese shops, etc. individually
- **Enhanced console output** - Shows exactly what changed, API calls made/saved, cost savings percentage

**Key Files:**
- `backend/processSheetData.js` - Change detection logic (processSheetData.js:157-176, 328-370)
- `backend/server.js` - Optional cron configuration (server.js:842-859)
- `.env` - `DATA_REFRESH_SCHEDULE` commented out by default
- `package.json` - New npm scripts for selective refresh (package.json:16-20)

**Documentation:**
- `DATA_REFRESH_GUIDE.md` - Complete workflow guide
- `DATA_REFRESH_QUICK_REFERENCE.md` - Quick reference card

### Performance Optimizations (2025-11)
**Impact:** 50-70% faster initial load, 80% reduction in scroll lag, 90% better map performance

**Map Performance:**
- **MarkerClusterer implementation:** Groups 228+ markers into clusters using SuperClusterAlgorithm
- **Custom Maine-themed clusters:** Green/teal color scheme matching Maine coastal theme
- **Configuration:** `src/components/Map/MapComponent.tsx:435-453` - radius: 60, minPoints: 3
- **Result:** Smooth map interaction even with all 228 locations visible

**Virtual Scrolling:**
- **@tanstack/react-virtual integration:** Only renders visible shop cards (10-15 instead of 228+)
- **Threshold:** Only enabled for 20+ items (smaller lists render normally)
- **Dynamic height measurement:** Accurate row heights for smooth scrolling
- **Implementation:** `src/components/Listings/ListingsPanel.tsx` using useVirtualizer
- **Result:** 80% reduction in DOM nodes, eliminates scroll lag

**Web Vitals Monitoring:**
- **Comprehensive tracking:** LCP, FID, CLS, FCP, INP, TTFB metrics
- **Development logging:** Color-coded console output (✅ good, ⚠️ needs improvement, ❌ poor)
- **Custom metrics:** Tracks shop loading performance
- **Implementation:** `src/utils/webVitals.ts`, integrated in App.tsx

**Loading Performance:**
- **Optimized images:** WebP format with JPEG/PNG fallbacks, responsive sizing (@1x, @2x, @3x)
- **Center pin optimization:** Reduced from 1.5MB to 1.72KB (99.9% reduction)
- **Preconnect hints:** Early connection to Google Maps domains (saves 50-200ms)
- **Compression:** Gzip/brotli for 60-80% transfer size reduction
- **Critical CSS:** Inline styles for faster initial paint

**Bundle Optimization:**
- **Code splitting:** Lazy loading of major components
- **Vendor chunks:** Separate chunks for React, Google Maps
- **Bundle analysis:** Visualizer plugin for identifying bloat
- **Tree shaking:** Automatic removal of unused code

**Developer Experience:**
- **TypeScript checking:** `npm run typecheck` without building
- **Bundle analysis:** `npm run analyze` generates visual report
- **Performance testing:** `npm run test:lighthouse` for audits
- **Comprehensive checks:** `npm run check:all` for pre-commit validation

### Multi-Location Type System (2025-01, expanded 2025-11)
- **Expanded from single location type to 8 types:** Farm stands, cheese shops, fish mongers, butchers, antique shops, breweries, wineries, sugar shacks
- **Feature flags:** Last 3 types can be enabled/disabled via environment variables
- **Type-specific product configurations:** Each location type has its own product config file with unique products and icons
- **Central product registry:** `src/config/productRegistry.ts` maps types → configs
- **Discriminated union types:** `Shop` type uses TypeScript discriminated unions with type guards
- **Data file separation:** Each location type has its own JSON file in `backend/data/`
- **Gitignore data files:** All generated JSON files are now gitignored and must be regenerated via `npm run process-data`
- **Unified API endpoint:** `/api/locations` returns all enabled location types combined
- **Shop Details Overlay:** Accordion interface (Products, Information, Hours)

### Version Control Improvements (2025-01)
- **Data files gitignored:** `backend/data/*.json` files are no longer tracked by git
- **Deployment guide added:** Comprehensive `DEPLOYMENT.md` with setup, build, and deployment instructions
- **Directory structure maintained:** Added `.gitkeep` to `backend/data/` directory

### Migrated Components (Using Domain Contexts)
The following components have been migrated from `AppContext` to specific domain hooks:
- ✅ **ProductFilters** - Uses `useFilters()`
- ✅ **Header** - Uses `useSearch()` + `useUI()`
- ✅ **SocialOverlay** - Uses `useDirections()` + `useSearch()`

**Performance Impact:** These components now only re-render when their specific domain state changes, reducing unnecessary re-renders.

### Accessibility Improvements
- Added ErrorBoundary with proper ARIA attributes
- All interactive elements have proper labels and roles
- Loading states announce to screen readers
- Form controls properly grouped with fieldsets

### Error Handling
- ErrorBoundaries wrapped around major sections (Header, Map, ListingsPanel)
- Prevents component errors from crashing the entire app
- User-friendly error messages with retry functionality

### Backend Improvements (2025-01)
- **Fixed ECONNRESET errors:** Added `ongoingUpdate` promise tracking in `server.js` to handle concurrent requests during data processing
- Prevents API endpoint failures when farm stand data is being refreshed
- API requests now wait for any ongoing data updates to complete before responding

### UI/UX Improvements (2025-01)
- **Map panning offset:** Reduced `SELECTED_SHOP_PAN_OFFSET_X` from 140px to 40px for better centering when shop is selected
- **Marker colors:** Selected markers now stay blue (`#4285F4`) instead of dark red for consistent visual feedback
- **Default search radius:** Increased from 10 miles to 20 miles for broader initial search results

## Common Workflows

### Updating Location Data (New Cost-Optimized Workflow)

**Scenario 1: Update product availability (e.g., add "beef" to 5 farms)**
```bash
# 1. Update Google Sheets (add checkmarks in "beef" column)
# 2. Run refresh for just farms
npm run process-data:farms
# 3. Check output - should see "📦 Product changes detected" (0 API calls!)
# 4. Restart server if running
```

**Scenario 2: Add 3 new farm stands**
```bash
# 1. Add new rows to Google Sheets with all details
# 2. Run refresh for just farms
npm run process-data:farms
# 3. Check output - should see "⭐ New location" (6-9 API calls total)
# 4. Restart server if running
```

**Scenario 3: Change phone number for 2 cheese shops**
```bash
# 1. Update phone numbers in Google Sheets
# 2. Run refresh for just cheese shops
npm run process-data:cheese
# 3. Check output - should see "⚠ Changes detected" (4-6 API calls total)
# 4. Restart server if running
```

**Scenario 4: Update multiple location types**
```bash
# 1. Update Google Sheets for farms AND cheese shops
# 2. Run refresh for all types (or run each separately)
npm run process-data
# 3. Check summary for each type
# 4. Restart server if running
```

**Scenario 5: Force full refresh (rare - for testing)**
```bash
# 1. Delete JSON files in backend/data/
rm backend/data/*.json
# 2. Run full refresh
npm run process-data
# 3. All locations treated as new (full API usage)
```

### Migrating a Component to Domain Contexts
1. Identify which domains the component uses (location data, search, filters, UI, directions, trip planner)
2. Replace legacy AppContext imports with specific imports:
   ```tsx
   import { useLocationData } from '../contexts/LocationDataContext';
   import { useSearch } from '../contexts/SearchContext';
   import { useFilters } from '../contexts/FilterContext';
   // etc.
   ```
3. Replace `const appContext = useContext(AppContext)` with:
   ```tsx
   const { allLocations, isLoadingLocations } = useLocationData();
   const { currentRadius, mapsApiReady } = useSearch();
   ```
4. Remove null checks (hooks throw errors if used outside providers)
5. Test the component
6. **Benefits:** Component now only re-renders when its specific domains change

**See:** `src/contexts/CONTEXTS.md` for detailed migration guide

### Adding a New Location Type
1. Create new Google Sheet tab for the location type
2. Add `GOOGLE_SHEET_URL_*` environment variable for the new sheet
3. Create product config file in `src/config/` (e.g., `bookstoreProducts.ts`)
4. Define products with `csvHeader`, `name`, `icon_available`, `icon_unavailable`, `category`
5. Register in `src/config/productRegistry.ts` (add to `PRODUCT_CONFIGS` and `CATEGORY_DISPLAY_ORDER`)
6. Add to `src/types/shop.ts`:
   - Add to `LocationType` union
   - Add to `ALL_LOCATION_TYPES` array
   - Create product interface (e.g., `BookstoreProducts`)
   - Create location interface (e.g., `Bookstore extends BaseLocation`)
   - Add to `Shop` discriminated union
   - Add type guard function (e.g., `isBookstore()`)
7. Update `backend/processSheetData.js` to process new location type
8. Add new data file path (e.g., `backend/data/bookstoresData.json`)
9. Update `backend/server.js` to load and combine new location type
10. Create icon images in `public/images/icons/` (2 per product)
11. Add npm script in `package.json` (e.g., `process-data:bookstores`)
12. Run `npm run process-data` to generate initial data

### Adding a New Product to Existing Location Type
1. Add column to appropriate Google Sheet tab
2. Update corresponding product config file in `src/config/` (e.g., `farmProducts.ts`)
3. Add boolean field to Shop interface in `src/types/shop.ts`
4. Update headerMap in `backend/processSheetData.js`
5. Add icon images to `public/images/icons/` (available and unavailable states)
6. Run `npm run process-data` to refresh data

### Modifying Google API Fields
1. Update `fieldsToFetchFromPlaces` array in processSheetData.js
2. Update PlaceDetails interface in src/types/shop.ts
3. Run `npm run process-data` to refresh data with new fields

### Debugging Data Issues
1. Check backend logs for API errors during data processing
2. Inspect JSON files in `backend/data/` directory directly
3. Use `/api/cache/flush-and-refresh` endpoint to force refresh (dev mode)
4. Check Google Sheet tabs have proper headers and data format
5. Verify all required data files exist: `farmStandsData.json`, `cheeseShopsData.json`, `fishMongersData.json`, `butchersData.json`, `antiqueShopsData.json` (plus `breweriesData.json`, `wineriesData.json`, `sugarShacksData.json` if those types are enabled)
6. If data files are missing, run `npm run process-data` to regenerate them

### Production Deployment
**See DEPLOYMENT.md for comprehensive deployment guide.**

Quick steps:
1. Clone repository and install dependencies: `npm install`
2. Configure environment variables in `.env`
3. Generate data files: `npm run process-data`
4. Build frontend: `npm run build:frontend`
5. Copy dist/ contents to backend/public/
6. Start backend: `npm run start:backend` (or use PM2 for production)
7. Server serves both API and static frontend

**Important:** Data files (`backend/data/*.json`) are gitignored and must be generated on each deployment.

## Tech Stack

### Frontend
- **Core:** React 18.3, TypeScript 5.4, Vite 6 (with SWC)
- **Routing:** React Router 6.23
- **Styling:** TailwindCSS 3.3.4
- **Maps:** Google Maps JavaScript API, @googlemaps/markerclusterer 2.6
- **Performance:** @tanstack/react-virtual 3.x (virtual scrolling), web-vitals 5.x (monitoring)
- **Drag & Drop:** @dnd-kit (for trip planner reordering)
- **Testing:** Vitest 4.x, React Testing Library 16.x, jest-axe

### Backend
- **Runtime:** Node.js 16+, Express 4
- **Security:** helmet (security headers), cors
- **Performance:** compression (gzip/brotli)
- **APIs:** Google Maps Services (Geocoding, Places, Directions)
- **Data Source:** Google Sheets (published as CSV)
- **Caching:** node-cache (in-memory)
- **Scheduling:** node-cron (disabled by default)
- **Environment:** dotenv

### Build & Development
- **Build:** Vite 6 (with SWC), TypeScript 5.4
- **Bundle Analysis:** rollup-plugin-visualizer
- **Image Optimization:** sharp, vite-plugin-imagemin
- **PWA:** vite-plugin-pwa with Workbox
- **Linting:** ESLint with TypeScript support
- **Package Management:** npm with npm-run-all for parallel tasks
