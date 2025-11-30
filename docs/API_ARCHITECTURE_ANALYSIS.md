# API Architecture Analysis & Enterprise Recommendations

## Current Architecture Overview

### Backend APIs (Node.js/Express)
1. **`GET /api/locations`** - Returns all location data (read from JSON files)
2. **`GET /api/geocode`** - Proxy for Google Geocoding API
3. **`GET /api/places/details`** - Proxy for Google Place Details API
4. **`GET /api/directions`** - Proxy for Google Directions API
5. **`GET /api/photo`** - Proxy for Google Places Photos API
6. **`GET /api/cache/flush-and-refresh`** - Dev endpoint to flush cache and refresh data
7. **`GET /api/config`** - Currently returns empty object

### Caching Strategy
- **In-memory cache** using `node-cache`
- **Cache TTLs:**
  - Geocoding: 24 hours (864000s)
  - Place Details: 6 hours (21600s), 15 min (900s) for opening_hours
  - Directions: 1 hour (3600s)
  - Farm Stands: Not cached (reads from file system)

### Data Flow
1. **Scheduled Updates:** Cron job (default hourly) runs `processSheetData.js`
2. **Data Storage:** Results saved to `backend/data/farmStandsData.json`
3. **Client Requests:** Frontend fetches `/api/locations` which reads from JSON files

---

## Issues & Inefficiencies Identified

### 🔴 Critical Issues

1. **No Locations Caching**
   - Every `/api/locations` request reads from disk
   - File I/O is slow compared to memory access
   - No HTTP caching headers (ETags, Last-Modified, Cache-Control)

2. **Redundant API Key Exposure**
   - Frontend has hardcoded Google API key in `appConfig.ts`
   - Backend also has separate API key
   - Risk: Frontend key can be extracted from client-side code

3. **Rate Limiting Issues**
   - Current limit: 100 requests per 15 min per IP
   - React Strict Mode + HMR causes rapid requests in dev
   - Current fix: disabling rate limiting in dev (not ideal)

4. **No Request Deduplication**
   - Multiple components can trigger same API calls simultaneously
   - Frontend doesn't cache API responses
   - No shared request pool/promise resolution

5. **Inefficient Photo Proxy**
   - `/api/photo` fetches full image on every request
   - No caching for photos
   - Could use CDN or static serving

### 🟡 Medium Priority Issues

6. **Missing Compression**
   - No gzip/brotli compression for API responses
   - Farm stands JSON (~19 entries) could be compressed

7. **No API Versioning**
   - All endpoints at `/api/*` with no version prefix
   - Breaking changes would affect all clients

8. **Limited Monitoring**
   - No metrics for API performance
   - No error tracking (Sentry, etc.)
   - Only console logging

9. **No Health Check Endpoint**
   - No `/health` or `/status` endpoint
   - Can't monitor server health programmatically

10. **Inefficient Data Refresh Logic**
    - File age check happens on every server restart
    - Could use database with automatic invalidation

### 🟢 Nice-to-Have Improvements

11. **No GraphQL/Modern API Pattern**
    - REST endpoints require multiple round trips
    - Could use GraphQL for flexible queries

12. **No WebSocket/SSE for Real-Time Updates**
    - Client polls for farm stands data
    - Could push updates when data changes

13. **No CDN Integration**
    - Static farm stands data served from origin
    - Could use CDN edge caching

---

## Enterprise-Level Recommendations

### Phase 1: Quick Wins (1-2 days)

#### 1.1 Add Response Caching for Farm Stands
**Priority: HIGH** | **Impact: HIGH** | **Effort: LOW**

```javascript
// In server.js
const farmStandsCache = {
  data: null,
  lastModified: null,
  etag: null
};

app.get('/api/locations', async (req, res) => {
  try {
    const stats = await fs.stat(FARM_STANDS_DATA_PATH);
    const fileModTime = stats.mtime.getTime();

    // Check if client has current version
    const clientETag = req.headers['if-none-match'];
    const clientModified = req.headers['if-modified-since'];

    if (farmStandsCache.data && farmStandsCache.lastModified === fileModTime) {
      // Use memory cache
      if (clientETag && clientETag === farmStandsCache.etag) {
        return res.status(304).end(); // Not Modified
      }

      res.set({
        'Cache-Control': 'public, max-age=3600', // 1 hour
        'ETag': farmStandsCache.etag,
        'Last-Modified': new Date(fileModTime).toUTCString()
      });
      return res.json(farmStandsCache.data);
    }

    // Read from file and update cache
    const farmStands = await fs.readJson(FARM_STANDS_DATA_PATH);
    const etag = `"${fileModTime}-${farmStands.length}"`;

    farmStandsCache.data = farmStands;
    farmStandsCache.lastModified = fileModTime;
    farmStandsCache.etag = etag;

    res.set({
      'Cache-Control': 'public, max-age=3600',
      'ETag': etag,
      'Last-Modified': new Date(fileModTime).toUTCString()
    });
    res.json(farmStands);
  } catch (error) {
    // ... error handling
  }
});
```

**Benefits:**
- ✅ Reduces disk I/O by 99%
- ✅ Enables browser caching (304 Not Modified responses)
- ✅ Reduces bandwidth usage

#### 1.2 Add Response Compression
**Priority: HIGH** | **Impact: MEDIUM** | **Effort: LOW**

```javascript
const compression = require('compression');

// Add before routes
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between speed and compression
}));
```

**Benefits:**
- ✅ Reduces payload size by 60-80%
- ✅ Faster load times on slow connections

#### 1.3 Add Health Check Endpoint
**Priority: MEDIUM** | **Impact: LOW** | **Effort: LOW**

```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      farmStandsData: false,
      googleMapsAPI: false
    }
  };

  // Check if data file exists and is recent
  try {
    const exists = await fs.pathExists(FARM_STANDS_DATA_PATH);
    const stats = exists ? await fs.stat(FARM_STANDS_DATA_PATH) : null;
    const ageMs = stats ? Date.now() - stats.mtime.getTime() : Infinity;
    health.checks.farmStandsData = exists && ageMs < MAX_DATA_AGE_MS;
  } catch (e) {
    health.checks.farmStandsData = false;
  }

  // Check Google API connectivity (cached)
  health.checks.googleMapsAPI = !!GOOGLE_API_KEY_BACKEND;

  const isHealthy = Object.values(health.checks).every(v => v);
  res.status(isHealthy ? 200 : 503).json(health);
});
```

#### 1.4 Frontend Request Deduplication
**Priority: HIGH** | **Impact: MEDIUM** | **Effort: MEDIUM**

Create a request cache utility:

```typescript
// src/utils/requestCache.ts
type PendingRequest<T> = Promise<T>;
const pendingRequests = new Map<string, PendingRequest<any>>();

export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheDuration: number = 60000 // 1 minute default
): Promise<T> {
  const cacheKey = `${url}_${JSON.stringify(options)}`;

  // Check if request is in flight
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // Create new request
  const request = fetch(url, options)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .finally(() => {
      // Remove from pending after completion
      setTimeout(() => pendingRequests.delete(cacheKey), cacheDuration);
    });

  pendingRequests.set(cacheKey, request);
  return request;
}
```

Use in apiService:

```typescript
export async function fetchAndProcessFarmStands(): Promise<Shop[]> {
  const rawData = await cachedFetch<Shop[]>('/api/locations', {}, 300000); // 5 min
  return rawData;
}
```

---

### Phase 2: Medium-Term Improvements (1 week)

#### 2.1 Implement API Versioning
**Priority: MEDIUM** | **Impact: MEDIUM** | **Effort: MEDIUM**

```javascript
// v1 routes
const v1Router = express.Router();
v1Router.get('/farm-stands', farmStandsHandler);
v1Router.get('/geocode', geocodeHandler);
// ... other routes

app.use('/api/v1', v1Router);

// Keep /api/* routes as aliases to v1 for backward compatibility
app.use('/api', v1Router);
```

#### 2.2 Add Structured Logging & Monitoring
**Priority: HIGH** | **Impact: HIGH** | **Effort: MEDIUM**

```javascript
const winston = require('winston');
const morgan = require('morgan');

// Structured logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// HTTP request logging
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));
```

#### 2.3 Add Error Tracking (Sentry)
**Priority: MEDIUM** | **Impact: HIGH** | **Effort: LOW**

```javascript
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
```

#### 2.4 Optimize Photo Serving
**Priority: MEDIUM** | **Impact: MEDIUM** | **Effort: MEDIUM**

Option A: Cache photos on disk
```javascript
const photoCache = new Map(); // In memory URL cache
const PHOTO_CACHE_DIR = path.join(__dirname, 'cache', 'photos');

app.get('/api/photo', async (req, res) => {
  const photoRef = req.query.photo_reference;
  const cacheFile = path.join(PHOTO_CACHE_DIR, `${photoRef}.jpg`);

  // Serve from disk cache if exists
  if (await fs.pathExists(cacheFile)) {
    const stats = await fs.stat(cacheFile);
    if (Date.now() - stats.mtime.getTime() < 7 * 24 * 60 * 60 * 1000) { // 7 days
      return res.sendFile(cacheFile);
    }
  }

  // Fetch and cache
  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?...`;
  const response = await fetch(photoUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  await fs.ensureDir(PHOTO_CACHE_DIR);
  await fs.writeFile(cacheFile, buffer);

  res.set('Content-Type', 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=604800'); // 7 days
  res.send(buffer);
});
```

Option B: Use CloudFlare/CDN caching with proper headers

---

### Phase 3: Long-Term/Advanced (2-4 weeks)

#### 3.1 Migrate to Redis for Caching
**Priority: HIGH** | **Impact: HIGH** | **Effort: HIGH**

**Why Redis?**
- ✅ Persistent cache survives server restarts
- ✅ Distributed caching for multiple servers
- ✅ Built-in TTL and eviction policies
- ✅ Pub/Sub for cache invalidation

```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

await client.connect();

// Replace node-cache with Redis
const cacheService = {
  async get(key) {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key, value, ttl) {
    await client.setEx(key, ttl, JSON.stringify(value));
  },

  async flush() {
    await client.flushAll();
  }
};
```

#### 3.2 Implement Database for Farm Stands
**Priority: MEDIUM** | **Impact: HIGH** | **Effort: HIGH**

**Current:** JSON file on disk
**Proposed:** PostgreSQL with caching layer

**Benefits:**
- ✅ ACID transactions
- ✅ Query optimization
- ✅ Incremental updates (no full file rewrite)
- ✅ Audit trail (track changes)
- ✅ Advanced filtering/search
- ✅ Backup/replication built-in

```sql
CREATE TABLE farm_stands (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  place_details JSONB,
  products JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_location (lat, lng),
  INDEX idx_slug (slug)
);

CREATE TABLE farm_stand_products (
  farm_stand_id INT REFERENCES farm_stands(id),
  product_name VARCHAR(50),
  available BOOLEAN,
  PRIMARY KEY (farm_stand_id, product_name)
);
```

#### 3.3 Add GraphQL API Layer
**Priority: LOW** | **Impact: MEDIUM** | **Effort: HIGH**

**Benefits:**
- ✅ Single request for multiple resources
- ✅ Client specifies exact fields needed
- ✅ Strongly typed schema
- ✅ Better developer experience

```graphql
type FarmStand {
  id: ID!
  slug: String!
  name: String!
  address: String
  location: Location
  products: [Product!]!
  placeDetails: PlaceDetails
}

type Location {
  lat: Float!
  lng: Float!
}

type Product {
  name: String!
  available: Boolean!
}

type Query {
  farmStands(
    filters: FarmStandFilters
    radius: Float
    center: LocationInput
  ): [FarmStand!]!

  farmStand(slug: String!): FarmStand

  directions(
    origin: LocationInput!
    destination: LocationInput!
  ): Directions
}
```

#### 3.4 Implement WebSocket/SSE for Real-Time Updates
**Priority: LOW** | **Impact: MEDIUM** | **Effort: MEDIUM**

```javascript
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: process.env.ALLOWED_ORIGINS }
});

// When farm stands data updates
io.emit('farmStands:updated', {
  timestamp: new Date(),
  count: farmStands.length
});

// Client subscribes
socket.on('farmStands:updated', () => {
  refetchFarmStands();
});
```

#### 3.5 Add CDN for Static Data
**Priority: MEDIUM** | **Impact: MEDIUM** | **Effort: MEDIUM**

**Options:**
1. **CloudFlare Workers** - Edge caching + serverless compute
2. **AWS CloudFront** - CDN with S3 backend
3. **Vercel Edge Network** - Automatic edge caching

**Setup:**
```javascript
// Set proper cache headers for CDN
res.set({
  'Cache-Control': 'public, max-age=3600, s-maxage=86400', // CDN caches for 24h
  'Surrogate-Control': 'max-age=86400',
  'Vary': 'Accept-Encoding'
});
```

---

## Performance Metrics & Targets

### Current State (Estimated)
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| `/api/locations` response time | ~50-100ms | ~5-10ms | 10x faster |
| Farm stands payload size | ~150KB | ~30KB | 5x smaller |
| Cache hit rate | 0% | 90%+ | ∞ |
| Concurrent request handling | ~100/min | ~10,000/min | 100x |
| API availability | ~99% | 99.9% | +0.9% |

### Implementation Priority Matrix

```
High Impact, Low Effort (Do First):
├─ Response caching with ETags
├─ Compression middleware
├─ Request deduplication
└─ Health check endpoint

High Impact, High Effort (Plan Carefully):
├─ Redis migration
├─ Database migration
└─ Monitoring/observability

Medium Impact:
├─ API versioning
├─ Photo optimization
└─ CDN integration

Low Priority (Nice to Have):
├─ GraphQL
├─ WebSocket updates
└─ Advanced analytics
```

---

## Security Recommendations

### 1. Remove Frontend API Key
**Issue:** Google Maps API key exposed in client code
**Solution:**
- Move all Maps API calls to backend proxy
- Use environment variables only
- Implement API key rotation

### 2. Add Request Signing
```javascript
const crypto = require('crypto');

function signRequest(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Verify signature on backend
if (req.headers['x-signature'] !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 3. Implement CORS Properly
```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 4. Add HTTPS Redirect
```javascript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});
```

---

## Cost Optimization

### Google Maps API Costs
**Current monthly estimate:** $50-200 (depends on usage)

**Optimizations:**
1. **Aggressive caching** - Reduce API calls by 90%
2. **Batch requests** - Combine multiple requests
3. **Use Places API efficiently** - Request only needed fields
4. **Photo caching** - Photos are expensive, cache aggressively
5. **Consider alternatives** - Mapbox, OpenStreetMap for non-critical features

**Projected savings:** 60-80% reduction ($30-160/month savings)

---

## Deployment & Infrastructure

### Recommended Stack
```yaml
Production:
  App Server: Node.js on AWS ECS/Fargate or Railway
  Database: AWS RDS PostgreSQL (if migrating from JSON)
  Cache: AWS ElastiCache Redis or Upstash
  CDN: CloudFlare or AWS CloudFront
  Monitoring: DataDog or New Relic
  Error Tracking: Sentry
  Load Balancer: AWS ALB or Nginx

Development:
  App: Docker Compose
  Database: PostgreSQL in Docker
  Cache: Redis in Docker
```

### Auto-Scaling Configuration
```javascript
// Health-based scaling
Target metrics:
- CPU: < 70%
- Memory: < 80%
- Response time: < 200ms p95
- Error rate: < 1%

Scale up: +1 instance when threshold exceeded for 2 min
Scale down: -1 instance when below threshold for 5 min
Min instances: 2 (high availability)
Max instances: 10
```

---

## Summary & Action Items

### Immediate Actions (This Week)
- [ ] Implement farm stands response caching with ETags
- [ ] Add compression middleware
- [ ] Add health check endpoint
- [ ] Implement frontend request deduplication
- [ ] Add structured logging

### Short Term (This Month)
- [ ] Set up error tracking (Sentry)
- [ ] Implement API versioning
- [ ] Optimize photo serving with disk cache
- [ ] Add comprehensive monitoring
- [ ] Remove frontend API key exposure

### Long Term (Next Quarter)
- [ ] Evaluate Redis migration
- [ ] Consider database migration from JSON files
- [ ] Implement CDN caching
- [ ] Add WebSocket for real-time updates (if needed)
- [ ] Consider GraphQL layer (if complexity warrants it)

---

## ROI Estimation

**Investment:** ~40-80 hours of development time
**Returns:**
- 🚀 **Performance:** 5-10x faster response times
- 💰 **Cost:** 60-80% reduction in API costs
- 📈 **Scalability:** 100x more concurrent users
- 🛡️ **Reliability:** 99% → 99.9% uptime
- 👥 **Developer Experience:** Faster iteration, better debugging

**Recommendation:** Implement Phase 1 immediately, Phase 2 within 1 month, evaluate Phase 3 based on growth needs.
