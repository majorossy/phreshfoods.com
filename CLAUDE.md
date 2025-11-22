# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PhreshFoods is a farm stand finder application for Maine. It's a React + TypeScript + Vite frontend with a Node.js/Express backend that fetches farm stand data from a Google Sheet, enriches it with Google Maps API data (geocoding, place details), and serves it to the frontend.

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

### Linting

```bash
npm run lint
# ESLint with TypeScript support
```

### Data Processing

**Manually refresh farm stand data:**
```bash
npm run process-data
# or: node backend/processSheetData.js
# Fetches Google Sheet data, geocodes addresses, enriches with Place Details
```

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
  - `AppContext.tsx` - Legacy composite context (backward compatibility)
  - `AppProviders.tsx` - Composite provider wrapping all domain contexts
  - `FarmDataContext.tsx` - Farm stand data & loading states
  - `SearchContext.tsx` - Location search & radius
  - `FilterContext.tsx` - Product filtering
  - `UIContext.tsx` - UI state (overlays, modals, selected shop)
  - `DirectionsContext.tsx` - Google Maps directions
  - `ToastContext.tsx` - Toast notifications
- `src/hooks/` - Custom React hooks
- `src/services/` - API service layer (apiService.ts)
- `src/types/` - TypeScript type definitions
- `src/config/` - App configuration (appConfig.ts)
- `src/utils/` - Utility functions (cookie helpers, SEO, etc.)

**State Management:**
- **Domain-Driven Context Architecture:** State is split into focused, single-responsibility contexts
- **Migration Status:** Components are being migrated from legacy `AppContext` to specific domain hooks
- **See:** `src/contexts/CONTEXTS.md` for comprehensive documentation

**Domain Contexts:**

1. **FarmDataContext** (`useFarmData()`)
   - `allFarmStands` - All farm stands fetched from backend
   - `currentlyDisplayedShops` - Filtered/sorted shops with distance calculations
   - `isLoadingFarmStands` - Loading state
   - `farmStandsError` - Error message if loading failed

2. **SearchContext** (`useSearch()`)
   - `lastPlaceSelectedByAutocomplete` - Search location from Google Places autocomplete
   - `searchTerm` - Current search input
   - `currentRadius` - Search radius in miles
   - `mapsApiReady` - Google Maps API loaded state
   - `mapViewTargetLocation` - Location to center map on

3. **FilterContext** (`useFilters()`)
   - `activeProductFilters` - User's selected product filters

4. **UIContext** (`useUI()`)
   - `selectedShop` - Currently selected shop for detail view
   - `isShopOverlayOpen` - Shop details overlay state
   - `isSocialOverlayOpen` - Social/directions overlay state
   - `isInitialModalOpen` - Initial search modal state

5. **DirectionsContext** (`useDirections()`)
   - `directionsResult` - Google Maps directions data
   - `directionsError` - Error message
   - `isFetchingDirections` - Loading state

6. **ToastContext** (`useToast()`)
   - `showToast()` - Display toast notifications

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
- `processSheetData.js` - Data processor that fetches Google Sheet, geocodes, and enriches data
- `cacheService.js` - In-memory caching (node-cache) for Google API responses
- `data/farmStandsData.json` - Processed farm stand data (generated file)

**Data Flow:**
1. **Scheduled refresh:** Cron job (default: hourly, configurable via `DATA_REFRESH_SCHEDULE` env var) runs `processSheetData.js`
2. **processSheetData.js:**
   - Fetches CSV from Google Sheet (via `GOOGLE_SHEET_URL`)
   - For each row: geocodes address, fetches Place Details
   - Saves enriched data to `backend/data/farmStandsData.json`
   - Has 500ms delay between API calls (`DELAY_BETWEEN_API_CALLS_MS`)
3. **server.js:**
   - Serves static files from `public/`
   - Provides `/api/farm-stands` endpoint (reads from farmStandsData.json)
   - Uses `ongoingUpdate` promise tracking to prevent ECONNRESET errors when data is being processed
   - Proxies Google Maps API calls: `/api/geocode`, `/api/places/details`, `/api/directions`
   - On-demand API calls are cached via `cacheService.js`

**API Endpoints:**
- `GET /api/config` - Config endpoint (currently returns empty object)
- `GET /api/farm-stands` - Returns all farm stands
- `GET /api/geocode?address=...` - Geocode an address (proxied to Google)
- `GET /api/places/details?placeId=...&fields=...` - Get Place Details (proxied to Google)
- `GET /api/directions?origin=...&destination=...` - Get directions (proxied to Google)
- `GET /api/cache/flush-and-refresh` - Flush cache and refresh data (dev only)

### Environment Variables

Required environment variables (backend):
- `GOOGLE_API_KEY_BACKEND` - Google Maps API key for server-side calls
- `GOOGLE_SHEET_URL` - Published CSV URL from Google Sheets
- `PORT` - Server port (default: 3000)
- `DATA_REFRESH_SCHEDULE` - Cron expression for data refresh (default: `1 * * * *` - every hour)
- `MAX_DATA_FILE_AGE_HOURS` - Max age before data refresh (default: 4 hours)
- `NODE_ENV` - Set to 'development' to enable cache flush endpoint
- `ALLOW_CACHE_FLUSH` - Set to 'true' to enable cache flush endpoint in non-dev

Frontend config is in `src/config/appConfig.ts` (includes hardcoded Google Maps API key - consider moving to env).

### Data Model

**Shop Type (src/types/shop.ts):**
- Fields from Google Sheet: Name, Address, City, Zip, Phone, Website, etc.
- Product booleans: beef, pork, lamb, chicken, turkey, duck, eggs, corn, carrots, potatoes, lettus, spinach, squash, tomatoes, peppers, cucumbers, zucchini, garlic, onions, strawberries, blueberries
- Geocoded data: lat, lng
- Enriched Google data: placeDetails (rating, opening_hours, photos, reviews, etc.)
- Social media: TwitterHandle, FacebookPageID, InstagramUsername, InstagramLink, etc.
- Routing: slug (used for /farm/:slug URLs)

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
- Place Autocomplete for location search (Note: Google deprecated `Autocomplete` in favor of `PlaceAutocompleteElement` - migration recommended but not urgent, 12+ months support guaranteed)

**Overlays:**
- Shop Details Overlay - Basic shop info
- Social Overlay - Social media, reviews, directions (tabbed interface)
- Initial Search Modal - First-time user experience

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

### Google API Rate Limiting
- Backend uses 500ms delay between API calls in processSheetData.js
- On-demand API calls (from user actions) are cached with varying TTLs:
  - Geocoding: 24 hours
  - Place Details: 6 hours (15 minutes if opening_hours requested)
  - Directions: 1 hour

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
- **CONTEXTS.md** (`src/contexts/CONTEXTS.md`) - Comprehensive context architecture documentation
- **ACCESSIBILITY_AUDIT.md** - Accessibility audit report and WCAG compliance status
- **TESTING_GUIDE.md** - Testing setup instructions and examples
- **README.md** - Basic project information

## Recent Architectural Improvements

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

### Migrating a Component to Domain Contexts
1. Identify which domains the component uses (farm data, search, filters, UI, directions)
2. Replace `import { AppContext } from '../contexts/AppContext'` with specific imports:
   ```tsx
   import { useFarmData } from '../contexts/FarmDataContext';
   import { useSearch } from '../contexts/SearchContext';
   // etc.
   ```
3. Replace `const appContext = useContext(AppContext)` with:
   ```tsx
   const { allFarmStands, isLoadingFarmStands } = useFarmData();
   const { currentRadius, mapsApiReady } = useSearch();
   ```
4. Remove null checks (hooks throw errors if used outside providers)
5. Test the component
6. **Benefits:** Component now only re-renders when its specific domains change

**See:** `src/contexts/CONTEXTS.md` for detailed migration guide

### Adding a New Product Filter
1. Add column to Google Sheet
2. Update `PRODUCT_ICONS_CONFIG` in src/config/appConfig.ts
3. Add boolean field to Shop interface in src/types/shop.ts
4. Update headerMap in backend/processSheetData.js
5. Add icon images to public/images/icons/ (available and unavailable states)

### Modifying Google API Fields
1. Update `fieldsToFetchFromPlaces` array in processSheetData.js
2. Update PlaceDetails interface in src/types/shop.ts
3. Run `npm run process-data` to refresh data with new fields

### Debugging Data Issues
1. Check backend logs for API errors during data processing
2. Inspect `backend/data/farmStandsData.json` directly
3. Use `/api/cache/flush-and-refresh` endpoint to force refresh (dev mode)
4. Check Google Sheet has proper headers and data format

### Production Deployment
1. Build frontend: `npm run build:frontend`
2. Copy dist/ contents to backend/public/
3. Ensure .env is configured on server
4. Start backend: `npm run start:backend`
5. Server serves both API and static frontend

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router 6, TailwindCSS
- **Backend:** Node.js, Express, dotenv
- **APIs:** Google Maps JavaScript API, Google Geocoding API, Google Places API, Google Directions API
- **Data Source:** Google Sheets (published as CSV)
- **Caching:** node-cache (in-memory)
- **Scheduling:** node-cron
- **Build:** Vite (SWC), TypeScript compiler
- **Linting:** ESLint with TypeScript support
