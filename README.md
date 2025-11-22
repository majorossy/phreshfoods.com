# PhreshFoods - Multi-Location Finder for Maine

PhreshFoods is a comprehensive location finder application for Maine, helping users discover local farm stands, cheese shops, fish mongers, butchers, and antique shops. The application features Google Maps integration, product filtering, and real-time location search.

## Features

- **Multi-Location Type Support**: Farm stands, cheese shops, fish mongers, butchers, and antique shops
- **Product Filtering**: Filter locations by specific products (58 unique products across all location types)
- **Location-Based Search**: Find locations near you with customizable radius
- **Google Maps Integration**: Interactive map with custom markers, directions, and place details
- **Detailed Shop Information**: Opening hours, ratings, reviews, product availability, and social media links
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: WCAG 2.1 Level AA compliant (~95%)

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **React Router 6** for routing
- **TailwindCSS** for styling
- **Google Maps JavaScript API** for maps and place data

### Backend
- **Node.js** with Express
- **Google Sheets** as data source (published as CSV)
- **Google Maps APIs** (Geocoding, Places, Directions)
- **node-cache** for API response caching
- **node-cron** for scheduled data refreshes

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Google Maps API key
- Google Sheet with location data

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd phreshfoods.com
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
npm run process-data
# Manually refresh location data from Google Sheets
# Geocodes addresses and enriches with Google Place Details
```

### Linting
```bash
npm run lint
```

### Testing
```bash
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Generate coverage report
```

## Project Structure

```
phreshfoods.com/
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

- `GET /api/farm-stands` - Get all locations (all types combined)
- `GET /api/config` - Get application configuration
- `GET /api/geocode?address=...` - Geocode an address
- `GET /api/places/details?placeId=...` - Get Google Place details
- `GET /api/directions?origin=...&destination=...` - Get directions
- `GET /api/cache/flush-and-refresh` - Flush cache and refresh data (dev only)

## Environment Variables

### Backend (.env)
- `GOOGLE_API_KEY_BACKEND` - Google Maps API key for server-side calls (required)
- `GOOGLE_SHEET_URL` - Published CSV URL from Google Sheets (required)
- `PORT` - Server port (default: 3000)
- `DATA_REFRESH_SCHEDULE` - Cron expression for data refresh (default: `1 * * * *`)
- `MAX_DATA_FILE_AGE_HOURS` - Max age before data refresh (default: 4)
- `NODE_ENV` - Environment (development/production)
- `ALLOW_CACHE_FLUSH` - Enable cache flush in non-dev (default: false)

### Frontend
Frontend configuration is in `src/config/appConfig.ts` (consider moving API key to environment variables).

## Data Processing

The application fetches location data from Google Sheets, processes it, and enriches it with Google Maps data:

1. **Data Source**: Google Sheets with tabs for each location type
2. **Processing**: `processSheetData.js` runs on a schedule (default: hourly)
3. **Geocoding**: Converts addresses to coordinates using Google Geocoding API
4. **Enrichment**: Fetches place details (ratings, hours, photos) from Google Places API
5. **Storage**: Saves to JSON files in `backend/data/`
6. **Caching**: API responses cached to reduce quota usage

### Location Types
- **Farm Stands**: 22 products (meats, vegetables, fruits, aromatics)
- **Cheese Shops**: 12 products (cheese types, milk sources)
- **Fish Mongers**: 12 products (fish and shellfish)
- **Butchers**: 12 products (meats, poultry, prepared items)
- **Antique Shops**: 10 products (furniture, jewelry, art, collectibles)

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

Quick overview:
1. Clone repository and install dependencies
2. Configure environment variables
3. Generate data files: `npm run process-data`
4. Build frontend: `npm run build:frontend`
5. Copy `dist/` contents to `backend/public/`
6. Start server: `npm run start:backend`

**Important**: Data files in `backend/data/` are gitignored and must be generated on each deployment.

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive project overview and development guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide with environment setup
- **[CONTEXTS.md](./src/contexts/CONTEXTS.md)** - Context architecture documentation
- **[ACCESSIBILITY_AUDIT.md](./ACCESSIBILITY_AUDIT.md)** - WCAG compliance audit
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing setup and examples

## Architecture Highlights

### Domain-Driven Context Architecture
State management is split into focused, single-responsibility contexts:
- **FarmDataContext** - Location data and loading states
- **SearchContext** - Location search and radius
- **FilterContext** - Product filtering
- **UIContext** - UI state (overlays, modals)
- **DirectionsContext** - Google Maps directions
- **ToastContext** - Toast notifications

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
2. Create product config file in `src/config/`
3. Update `backend/processSheetData.js` to process new type
4. Update `backend/server.js` to load and combine new type
5. Create icon images in `public/images/icons/`
6. Run `npm run process-data` to generate data

### Adding a New Product
1. Add column to appropriate Google Sheet tab
2. Update corresponding product config file in `src/config/`
3. Add boolean field to Shop interface in `src/types/shop.ts`
4. Update headerMap in `backend/processSheetData.js`
5. Add icon images to `public/images/icons/`
6. Run `npm run process-data` to refresh data

## License

[Add your license here]

## Support

For issues or questions, please contact [your contact information].
