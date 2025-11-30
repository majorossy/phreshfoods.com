# phind.us - Multi-Location Finder for Maine

phind.us is a comprehensive location finder application for Maine, helping users discover local farm stands, cheesemongers, fishmongers, butchers, antiques, breweries, wineries, and sugar shacks. The application features Google Maps integration, product filtering, trip planning, and real-time location search.

## Features

- **Multi-Location Type Support**: 8 location types (farm stands, cheesemongers, fishmongers, butchers, antiques, breweries, wineries, sugar shacks)
- **Product Filtering**: Filter locations by specific products (~93 unique products across all location types)
- **Location Type Filtering**: Show/hide specific location types
- **Location-Based Search**: Find locations near you with customizable radius
- **Trip Planning**: Build multi-stop trips with route optimization and shareable URLs
- **Google Maps Integration**: Interactive map with custom markers, clustering, directions, and place details
- **Detailed Shop Information**: Opening hours, ratings, reviews, product availability, and social media links
- **Responsive Design**: Works seamlessly on desktop and mobile devices with mobile-optimized bottom sheet
- **Accessibility**: WCAG 2.1 Level AA compliant (~95%)
- **Performance Optimized**: Virtual scrolling, map clustering, Web Vitals monitoring, and optimized images

## Tech Stack

### Frontend
- **React 18.3** with TypeScript 5.4
- **Vite 6** for fast development and optimized builds (with SWC)
- **React Router 6** for routing
- **TailwindCSS** for styling
- **Google Maps JavaScript API** for maps and place data
- **@googlemaps/markerclusterer** for efficient map marker clustering
- **@tanstack/react-virtual** for virtual scrolling performance
- **@dnd-kit** for drag-and-drop trip reordering
- **web-vitals** for performance monitoring

### Backend
- **Node.js** with Express
- **Google Sheets** as data source (published as CSV)
- **Google Maps APIs** (Geocoding, Places, Directions)
- **node-cache** for API response caching
- **node-cron** for scheduled data refreshes (disabled by default)
- **compression** for gzip/brotli response compression
- **helmet** for security headers

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Google Maps API key
- Google Sheet with location data

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd phind.us
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
GOOGLE_API_KEY_BACKEND=your_google_api_key_here
GOOGLE_SHEET_URL=your_published_google_sheet_csv_url
PORT=3000
NODE_ENV=development
```

4. Generate data files (required on first run):
```bash
npm run process-data
```

5. Start the development server:
```bash
npm run dev:full
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Development Commands

### Full Stack Development
```bash
npm run dev:full
# Runs both frontend (Vite dev server) and backend (Express) concurrently
```

### Frontend Only
```bash
npm run dev
# Vite dev server with HMR on port 5173
```

### Backend Only
```bash
npm run start:backend
# Express server on port 3000
```

### Build
```bash
npm run build:frontend  # Build frontend only
npm run build           # Build both frontend and backend
```

### Data Processing
```bash
# Refresh all location types
npm run process-data

# Refresh specific location type only (faster)
npm run process-data:farms        # Farm stands only
npm run process-data:cheese       # Cheese shops only
npm run process-data:fish         # Fish mongers only
npm run process-data:butchers     # Butchers only
npm run process-data:antiques     # Antique shops only
npm run process-data:breweries    # Breweries only
npm run process-data:wineries     # Wineries only
npm run process-data:sugar-shacks # Sugar shacks only
```

See [DATA_REFRESH_GUIDE.md](./DATA_REFRESH_GUIDE.md) for complete documentation.

### Linting
```bash
npm run lint
```

### Testing
```bash
npm run test          # Run tests in watch mode
npm run test:ui       # Run tests with UI dashboard
npm run test:run      # Run tests once
npm run test:coverage # Generate coverage report
```

### Developer Experience Scripts
```bash
npm run typecheck        # Type check without building
npm run typecheck:watch  # Type check in watch mode
npm run analyze          # Analyze bundle size (generates dist/stats.html)
npm run build:analyze    # Build and analyze bundle
npm run dev:debug        # Run with DEBUG output
npm run test:lighthouse  # Run Lighthouse performance audit
npm run clean            # Clean all deps and reinstall
npm run clean:cache      # Clean build cache
npm run check:deps       # Check for outdated dependencies
npm run check:security   # Run security audit
npm run check:all        # Run all checks (typecheck, lint, test)
```

## Project Structure

```
phind.us/
├── src/                        # Frontend source code
│   ├── components/            # React components
│   │   ├── Filters/          # Product filtering UI
│   │   ├── Header/           # Navigation and search
│   │   ├── Listings/         # Shop cards and listings
│   │   ├── Map/              # Google Maps integration
│   │   ├── Overlays/         # Modals and overlays
│   │   └── UI/               # Reusable UI components
│   ├── contexts/             # React Context providers
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API service layer
│   ├── types/                # TypeScript definitions
│   ├── config/               # App and product configurations
│   └── utils/                # Utility functions
├── backend/                   # Backend server
│   ├── server.js             # Express server
│   ├── processSheetData.js   # Data processor
│   ├── cacheService.js       # API caching
│   └── data/                 # Generated JSON files (gitignored)
├── public/                    # Static assets
│   └── images/icons/         # Product icons
└── dist/                      # Production build (generated)
```

## API Endpoints

- `GET /api/locations` - Get all locations (all types combined)
- `GET /api/config` - Get application configuration
- `GET /api/geocode?address=...` - Geocode an address
- `GET /api/places/details?placeId=...` - Get Google Place details
- `GET /api/directions?origin=...&destination=...` - Get directions
- `GET /api/cache/flush-and-refresh` - Flush cache and refresh data (dev only)

## Environment Variables

### Backend (.env)
- `GOOGLE_API_KEY_BACKEND` - Google Maps API key for server-side calls (required)
- `GOOGLE_SHEET_URL` - Published CSV URL for farm stands (required)
- `GOOGLE_SHEET_URL_CHEESE_SHOPS` - Published CSV URL for cheese shops
- `GOOGLE_SHEET_URL_FISH_MONGERS` - Published CSV URL for fish mongers
- `GOOGLE_SHEET_URL_BUTCHERS` - Published CSV URL for butchers
- `GOOGLE_SHEET_URL_ANTIQUE_SHOPS` - Published CSV URL for antique shops
- `GOOGLE_SHEET_URL_BREWERIES` - Published CSV URL for breweries (optional)
- `GOOGLE_SHEET_URL_WINERIES` - Published CSV URL for wineries (optional)
- `GOOGLE_SHEET_URL_SUGAR_SHACKS` - Published CSV URL for sugar shacks (optional)
- `PORT` - Server port (default: 3000)
- `DATA_REFRESH_SCHEDULE` - Cron expression for automatic refresh (DISABLED by default to reduce API costs)
- `MAX_DATA_FILE_AGE_HOURS` - Max age before data refresh (default: 720 hours / 30 days)
- `NODE_ENV` - Environment (development/production)
- `ALLOW_CACHE_FLUSH` - Enable cache flush in non-dev (default: false)
- `ENABLE_BREWERIES` - Enable brewery location type (default: false)
- `ENABLE_WINERIES` - Enable winery location type (default: false)
- `ENABLE_SUGAR_SHACKS` - Enable sugar shack location type (default: false)

### Frontend (.env)
- `VITE_ENABLE_BREWERIES` - Enable breweries in frontend (default: false)
- `VITE_ENABLE_WINERIES` - Enable wineries in frontend (default: false)
- `VITE_ENABLE_SUGAR_SHACKS` - Enable sugar shacks in frontend (default: false)

Frontend configuration is in `src/config/appConfig.ts` and `src/config/enabledLocationTypes.ts`.

## Data Processing

**⚠️ IMPORTANT: Automatic refresh is DISABLED by default to reduce API costs by ~95%**

The application fetches location data from Google Sheets, processes it, and enriches it with Google Maps data:

1. **Data Source**: Google Sheets with tabs for each location type
2. **Processing**: `processSheetData.js` runs **manually** (or optionally on a schedule)
3. **Change Detection**: Smart detection of location vs product changes
   - ✓ No changes → Reuses all cached data (0 API calls)
   - 📦 Product changes → Updates products only (0 API calls)
   - ⚠ Location changes → Fetches from Google APIs (2-3 API calls)
4. **Geocoding**: Converts addresses to coordinates using Google Geocoding API (only when needed)
5. **Enrichment**: Fetches place details (ratings, hours, photos) from Google Places API (only when needed)
6. **Storage**: Saves to JSON files in `backend/data/`
7. **Caching**: API responses cached to reduce quota usage

### Cost Optimization
- **Manual refresh only** (run when YOU update Google Sheets)
- **Intelligent change detection** (only updates what changed)
- **Product updates are FREE** (no API calls for product availability changes)
- **Expected monthly cost**: $0.50-$2 (vs $26-30 with hourly refresh)

### Location Types (8 total)
- **Farm Stands**: 22 products (meats, vegetables, fruits, aromatics)
- **Cheese Shops**: 12 products (cheese types, milk sources)
- **Fish Mongers**: 12 products (fish and shellfish)
- **Butchers**: 12 products (meats, poultry, prepared items)
- **Antique Shops**: 10 products (furniture, jewelry, art, collectibles)
- **Breweries**: 9 products (beer styles) *(feature-flagged)*
- **Wineries**: 10 products (wine types) *(feature-flagged)*
- **Sugar Shacks**: 6 products (maple products) *(feature-flagged)*

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

Quick overview:
1. Clone repository and install dependencies
2. Configure environment variables (all 5 `GOOGLE_SHEET_URL_*` variables)
3. **Generate data files**: `npm run process-data` (required on first deployment)
4. Build frontend: `npm run build:frontend`
5. Copy `dist/` contents to `backend/public/`
6. Start server: `npm run start:backend`
7. **Refresh data manually** when you update Google Sheets (run `npm run process-data` or specific type)

**Important**:
- Data files in `backend/data/` are gitignored and must be generated on each deployment
- Automatic refresh is disabled by default - refresh manually when needed
- See [DATA_REFRESH_GUIDE.md](./DATA_REFRESH_GUIDE.md) for complete workflow

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive project overview and development guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide with environment setup
- **[DATA_REFRESH_GUIDE.md](./DATA_REFRESH_GUIDE.md)** - Data refresh workflow and cost optimization
- **[DATA_REFRESH_QUICK_REFERENCE.md](./DATA_REFRESH_QUICK_REFERENCE.md)** - Quick reference for data refresh commands
- **[CONTEXTS.md](./src/contexts/CONTEXTS.md)** - Context architecture documentation
- **[ACCESSIBILITY_AUDIT.md](./ACCESSIBILITY_AUDIT.md)** - WCAG compliance audit
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing setup and examples

## Performance Optimizations

### Map Performance
- **MarkerClusterer**: Efficiently groups 228+ markers into clusters
- **Custom Maine-themed cluster styling**: Green/teal color scheme
- **SuperClusterAlgorithm**: Fast clustering with configurable radius

### List Performance
- **Virtual Scrolling**: Only renders visible shop cards (10-15 instead of 228+)
- **@tanstack/react-virtual**: Dramatically reduces DOM nodes and memory usage
- **Dynamic threshold**: Only enables for 20+ items (smaller lists render normally)
- **Responsive grid layout**: Adapts to screen size while maintaining performance

### Loading Performance
- **Web Vitals Monitoring**: Tracks LCP, FID, CLS, FCP, INP, TTFB
- **Optimized Images**: WebP format with fallbacks, responsive sizing
- **Preconnect hints**: Early connection to Google Maps domains
- **Compression**: Gzip/brotli for 60-80% size reduction
- **Critical CSS**: Inline styles for faster initial paint

### Bundle Optimization
- **Code splitting**: Lazy loading of components
- **Tree shaking**: Removes unused code
- **Chunk optimization**: Separate vendor chunks for better caching

## Architecture Highlights

### Domain-Driven Context Architecture (7 Contexts)
State management is split into focused, single-responsibility contexts:
- **LocationDataContext** - All location data and loading states (primary)
- **SearchContext** - Location search and radius
- **FilterContext** - Product and location type filtering
- **UIContext** - UI state (overlays, modals, selected/hovered shop)
- **DirectionsContext** - Google Maps directions
- **ToastContext** - Toast notifications
- **TripPlannerContext** - Trip planning with multi-stop routes

This architecture reduces unnecessary re-renders and improves maintainability.

### Google Maps Integration
- Custom markers with hover and selection states
- InfoWindow previews for quick shop information
- Directions rendering with turn-by-turn navigation
- Place Autocomplete for location search
- Distance calculations using geometry library

### Error Handling
- Error boundaries around major sections (Header, Map, Listings)
- Prevents component errors from crashing the app
- User-friendly error messages with retry functionality

## Contributing

### Adding a New Location Type
1. Create Google Sheet tab for the location type
2. Add `GOOGLE_SHEET_URL_*` environment variable
3. Create product config file in `src/config/`
4. Register in `src/config/productRegistry.ts`
5. Add types to `src/types/shop.ts` (LocationType union, product interface, type guard)
6. Update `backend/processSheetData.js` to process new type
7. Update `backend/server.js` to load and combine new type
8. Create icon images in `public/images/icons/`
9. Add npm script in `package.json`
10. Run `npm run process-data` to generate data

### Adding a New Product
1. Add column to appropriate Google Sheet tab
2. Update corresponding product config file in `src/config/`
3. Add boolean field to product interface in `src/types/shop.ts`
4. Update headerMap in `backend/processSheetData.js`
5. Add icon images to `public/images/icons/`
6. Run `npm run process-data` to refresh data

## License

[Add your license here]

## Support

For issues or questions, please contact [your contact information].
