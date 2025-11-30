# Refresh Procedure

This document describes the "refresh" operation for the phind.us application.

## What is "Refresh"?

"Refresh" is a complete system reset that:
1. Stops all servers and services
2. Kills any stuck processes if necessary
3. Clears all caches
4. Pulls fresh data from all sources (Google Sheets)
5. Restarts services with clean state

## When to Use Refresh

Use the refresh procedure when:
- Data seems stale or incorrect
- Services are behaving unexpectedly
- You want to ensure you're working with the latest data
- After making changes to data processing or caching logic

## Refresh Steps

### 1. Stop All Servers and Services

```bash
# Kill all Node.js and Vite processes
pkill -9 -f "node.*server.js"
pkill -9 -f vite
pkill -9 -f "npm.*dev"

# Force kill processes on development ports
lsof -ti:3000,5173 | xargs kill -9 2>/dev/null

# Wait a moment for processes to terminate
sleep 1
```

### 2. Clear All Caches

```bash
# Delete all generated data JSON files
rm -rf backend/data/*.json

# Clear build artifacts
rm -rf dist

# Clear Vite cache
rm -rf node_modules/.vite
```

**What gets cleared:**
- `backend/data/farmStandsData.json`
- `backend/data/cheeseShopsData.json`
- `backend/data/fishMongersData.json`
- `backend/data/butchersData.json`
- `backend/data/antiqueShopsData.json`
- `backend/data/breweriesData.json` (if enabled)
- `backend/data/wineriesData.json` (if enabled)
- `backend/data/sugarShacksData.json` (if enabled)
- `dist/` folder (frontend build output)
- `node_modules/.vite/` (Vite cache)

### 3. Pull Fresh Data from Google Sheets

```bash
# Run the data processor to fetch fresh data from Google Sheets
npm run process-data
```

This will:
- Fetch CSV data from all configured Google Sheet URLs
- Geocode addresses for each location
- Fetch Place Details from Google Maps API
- Enrich location data with ratings, hours, photos, etc.
- Save processed data to `backend/data/*.json` files

**Expected output:**
- Processing messages for each location type
- Count of locations processed (e.g., "19 farm stands", "17 cheese shops")
- Total locations across all types

### 4. Restart Services with Clean State

```bash
# Start both frontend and backend in parallel
npm run dev:full
```

This runs:
- **Backend**: Express server on port 3000
- **Frontend**: Vite dev server on port 5173

**Verify successful startup:**
- Backend logs: `Server running on http://0.0.0.0:3000`
- Frontend logs: `Local: http://localhost:5173/`
- Check location count: `curl -s http://localhost:3000/api/locations | jq 'length'`

## Quick Reference Command

For a quick refresh, you can chain all commands together:

```bash
# Kill processes
pkill -9 -f "node.*server.js"; pkill -9 -f vite; lsof -ti:3000,5173 | xargs kill -9 2>/dev/null

# Clear caches
rm -rf backend/data/*.json dist node_modules/.vite

# Pull fresh data and restart
npm run process-data && npm run dev:full
```

## Troubleshooting

### Ports Still in Use
If you get "port already in use" errors:
```bash
# Find process using the port
lsof -ti:3000
lsof -ti:5173

# Kill specific process
kill -9 <PID>
```

### Data Files Not Generated
If `backend/data/*.json` files are not created after `npm run process-data`:
- Check that `.env` file has `GOOGLE_SHEET_URL` and `GOOGLE_API_KEY_BACKEND` set
- Check backend logs for API errors
- Verify Google Sheet URLs are accessible
- Ensure Google Maps API key has proper permissions

### Missing Location Types
If some location types are missing after refresh:
- Check that all `GOOGLE_SHEET_URL_*` variables are set in `.env`
- Verify each Google Sheet is published as CSV
- Check processor logs for errors specific to that location type

## Data Sources

The refresh pulls data from these Google Sheets (configured in `.env`):
- `GOOGLE_SHEET_URL` - Farm stands
- `GOOGLE_SHEET_URL_CHEESE_SHOPS` - Cheese shops
- `GOOGLE_SHEET_URL_FISH_MONGERS` - Fish mongers
- `GOOGLE_SHEET_URL_BUTCHERS` - Butchers
- `GOOGLE_SHEET_URL_ANTIQUE_SHOPS` - Antique shops
- `GOOGLE_SHEET_URL_BREWERIES` - Breweries (feature-flagged)
- `GOOGLE_SHEET_URL_WINERIES` - Wineries (feature-flagged)
- `GOOGLE_SHEET_URL_SUGAR_SHACKS` - Sugar shacks (feature-flagged)

## Expected Results

After a successful refresh, you should have:
- All data JSON files in `backend/data/`
- Backend serving at http://localhost:3000
- Frontend serving at http://localhost:5173
- Total locations matching sum of all enabled types

**Example location counts (varies based on enabled types):**
- 19 farm stands
- 17 cheese shops
- 17 fish mongers
- 20 butchers
- 40 antique shops
- Plus breweries, wineries, sugar shacks (if enabled via feature flags)
- **Base Total: ~113+ locations**

## Notes

- The refresh process typically takes 2-5 minutes depending on the number of locations
- API calls to Google Maps are rate-limited (500ms delay between calls)
- In-memory cache is automatically cleared when services restart
- Cron job for automatic data refresh will resume after restart

## History

- **2025-01-22**: Initial refresh procedure documented
- Cleared all caches and pulled fresh data
- Implemented marker pooling and useEffect optimizations
- Added collapse/expand functionality to ShopDetailsOverlay
