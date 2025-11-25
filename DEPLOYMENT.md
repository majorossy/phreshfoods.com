# PhreshFoods Deployment Guide

This guide covers deploying PhreshFoods to production.

## Prerequisites

- Node.js 18+ installed
- Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Geocoding API
  - Places API
  - Directions API
- Access to the Google Sheets data source
- Git access to the repository

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd phreshfoods.com
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Required - Google Maps API Key for backend geocoding and place details
GOOGLE_API_KEY_BACKEND=your_google_api_key_here

# Required - Published Google Sheets CSV URL
# To get this: File > Share > Publish to web > Select CSV format
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/e/.../pub?output=csv

# Optional - Server port (default: 3000)
PORT=3000

# Optional - Data refresh schedule (cron format, default: every hour)
# Default: "1 * * * *" (every hour at 1 minute past)
DATA_REFRESH_SCHEDULE="1 * * * *"

# Optional - Maximum age of data file before refresh (default: 4 hours)
MAX_DATA_FILE_AGE_HOURS=4

# Optional - Development mode (enables cache flush endpoint)
NODE_ENV=production

# Optional - Allow cache flush in production (set to 'true' only if needed)
# ALLOW_CACHE_FLUSH=false
```

### 4. Configure Frontend API Key

The frontend also needs a Google Maps API key. This is currently hardcoded in the source.

**Update:** `src/config/appConfig.ts`

```typescript
googleMapsApiKey: 'YOUR_FRONTEND_GOOGLE_MAPS_API_KEY',
```

Note: Consider moving this to an environment variable for better security.

## Initial Data Setup

### 1. Generate Data Files

The application requires JSON data files to be generated from the Google Sheets source:

```bash
npm run process-data
```

This command will:
- Fetch data from Google Sheets (all location types: farm stands, cheese shops, fish mongers, butchers, antique shops)
- Geocode all addresses using Google Geocoding API
- Enrich each location with Google Place Details (ratings, hours, photos, reviews)
- Save processed data to `backend/data/*.json`

**Important:** These JSON files are gitignored and must be generated on each deployment.

### 2. Verify Data Files

After processing, verify that all required data files exist:

```bash
ls -lh backend/data/
```

You should see:
- `farmStandsData.json`
- `cheeseShopsData.json`
- `fishMongersData.json`
- `butchersData.json`
- `antiqueShopsData.json`

## Build Process

### 1. Build Frontend

```bash
npm run build:frontend
```

This will:
- Run TypeScript type checking
- Build the React app with Vite
- Output to `dist/` directory

### 2. Prepare Static Files

Copy the built frontend to the backend's public directory:

```bash
# Create public directory if it doesn't exist
mkdir -p backend/public

# Copy dist contents to public
cp -r dist/* backend/public/
```

## Deployment

### Option 1: Node.js Server (Recommended for Development/Testing)

```bash
# Start the backend server
npm run start:backend
# or
node backend/server.js
```

The server will:
- Serve the frontend from `backend/public/`
- Provide API endpoints at `/api/*`
- Run scheduled data refreshes based on `DATA_REFRESH_SCHEDULE`
- Listen on port specified in `.env` (default: 3000)

### Option 2: Production Server (PM2)

For production, use a process manager like PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start backend/server.js --name phreshfoods

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Option 3: Docker (Advanced)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Build frontend
RUN npm run build:frontend
RUN mkdir -p backend/public && cp -r dist/* backend/public/

# Generate initial data
RUN npm run process-data

EXPOSE 3000

CMD ["node", "backend/server.js"]
```

Build and run:

```bash
docker build -t phreshfoods .
docker run -p 3000:3000 --env-file .env phreshfoods
```

## Post-Deployment Verification

### 1. Health Checks

Verify the server is running:

```bash
curl http://localhost:3000/api/config
```

### 2. Data API

Check that location data is available:

```bash
curl http://localhost:3000/api/locations | jq 'length'
```

Should return the total number of locations across all types.

### 3. Frontend

Visit `http://localhost:3000` in a browser and verify:
- Map loads correctly
- Search autocomplete works
- Location markers appear
- Clicking a marker shows details
- Filters work for each location type

## Maintenance

### Manual Data Refresh

To manually refresh data from Google Sheets:

```bash
npm run process-data
```

Or use the API endpoint (development mode only):

```bash
curl http://localhost:3000/api/cache/flush-and-refresh
```

### Updating Google Sheets

When you update the Google Sheets data:
1. The cron job will automatically refresh data based on `DATA_REFRESH_SCHEDULE`
2. For immediate updates, run `npm run process-data` manually
3. Data files older than `MAX_DATA_FILE_AGE_HOURS` will be auto-refreshed on server start

### Logs

Monitor application logs:

```bash
# PM2
pm2 logs phreshfoods

# Docker
docker logs -f <container-id>

# Direct node
# Logs go to stdout/stderr
```

## Troubleshooting

### Data Files Missing

**Symptom:** API returns empty results or errors

**Solution:**
```bash
npm run process-data
```

### Google API Quota Exceeded

**Symptom:** Geocoding or place details fail during data processing

**Solution:**
- Check your Google Cloud Console for API quotas
- Increase the delay between API calls in `backend/processSheetData.js` (default: 500ms)
- Consider upgrading your Google Maps API billing plan

### ECONNRESET Errors

**Symptom:** API requests fail with ECONNRESET during data refresh

**Solution:**
- The backend has built-in handling for concurrent requests during data processing
- If issues persist, increase `DELAY_BETWEEN_API_CALLS_MS` in processSheetData.js

### Map Not Loading

**Symptom:** Map appears blank or shows errors

**Checklist:**
- Verify `GOOGLE_API_KEY_BACKEND` is set in `.env`
- Verify frontend API key in `src/config/appConfig.ts`
- Check browser console for API key errors
- Ensure Maps JavaScript API is enabled in Google Cloud Console

## Rollback Procedure

If a deployment fails:

1. **Revert to previous commit:**
   ```bash
   git revert HEAD
   git push
   ```

2. **Rebuild and redeploy:**
   ```bash
   npm run build:frontend
   cp -r dist/* backend/public/
   pm2 restart phreshfoods
   ```

3. **Restore previous data files** (if you have backups):
   ```bash
   cp backup/*.json backend/data/
   pm2 restart phreshfoods
   ```

## Scaling Considerations

### Horizontal Scaling

The application can be scaled horizontally with a few modifications:

1. **Move data files to shared storage** (S3, Cloud Storage, etc.)
2. **Use a distributed cache** (Redis) instead of in-memory node-cache
3. **Separate data processing** into a dedicated worker service
4. **Use a load balancer** to distribute traffic across multiple instances

### Caching Strategy

Current caching (in-memory via node-cache):
- Geocoding: 24 hours
- Place Details: 6 hours (15 minutes if opening_hours requested)
- Directions: 1 hour

For production at scale, consider:
- Using Redis for shared caching across instances
- Implementing CDN caching for static assets
- Adding HTTP caching headers for API responses

## Security Checklist

- [ ] Environment variables are not committed to git
- [ ] `.env` file is gitignored
- [ ] Google API keys have appropriate restrictions
- [ ] Data files are gitignored
- [ ] Cache flush endpoint is disabled in production (`NODE_ENV=production` and `ALLOW_CACHE_FLUSH` not set)
- [ ] HTTPS is enabled (if deployed publicly)
- [ ] CORS is properly configured for your domain

## Monitoring

Consider setting up monitoring for:
- Server uptime
- API response times
- Google API quota usage
- Error rates
- Data refresh success/failure
- Disk space (for data files and logs)

Recommended tools:
- PM2 monitoring: `pm2 monitor`
- Application Performance Monitoring (APM): New Relic, DataDog, etc.
- Log aggregation: Loggly, Papertrail, etc.
- Uptime monitoring: Pingdom, UptimeRobot, etc.

## Support

For issues or questions:
- Review `CLAUDE.md` for detailed project architecture
- Check `CONTEXTS.md` for frontend state management
- Review `ACCESSIBILITY_AUDIT.md` for accessibility compliance
- Check `TESTING_GUIDE.md` for testing instructions
