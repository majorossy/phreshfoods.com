# Refactoring & Optimization Opportunities

**Generated:** 2025-01-29
**Codebase Size:** ~22,000 lines of TypeScript
**Status:** Production-ready with optimization opportunities

---

## 🎯 High-Impact Optimizations

### 1. Remove Unused AppContext (Legacy Code)
**Impact:** Medium | **Effort:** Low

**Current State:**
- `src/contexts/AppContext.tsx` exists but is deprecated
- All components have been migrated to domain-specific contexts
- Still imported/exported from `AppProviders.tsx` for backward compatibility

**Action Items:**
```bash
# Search for any remaining AppContext usage
grep -r "AppContext" src/components src/hooks

# If no results (except AppProviders), remove:
- src/contexts/AppContext.tsx
- Import/export from AppProviders.tsx
```

**Benefits:**
- Reduce bundle size by ~200-300 lines
- Cleaner context architecture
- Less confusion for future developers

---

### 2. Optimize Header Component (Complex Inline Logic)
**Impact:** High | **Effort:** Medium

**Current Issues:**
- `src/components/Header/Header.tsx` is 600+ lines
- Complex inline event handlers
- Hardcoded `LOCATION_TYPE_CONFIG` object
- Duplicate filtering logic in two places

**Refactoring Suggestions:**

**A. Extract Location Type Chips to Separate Component**
```tsx
// src/components/Header/LocationTypeChips.tsx
export const LocationTypeChips: React.FC = () => {
  const { activeLocationTypes, toggleLocationType } = useFilters();

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {ENABLED_LOCATION_TYPES.map((locationType) => (
        <LocationTypeChip
          key={locationType}
          type={locationType}
          isActive={activeLocationTypes.has(locationType)}
          onToggle={toggleLocationType}
        />
      ))}
    </div>
  );
};
```

**B. Move LOCATION_TYPE_CONFIG to Centralized Config**
```tsx
// src/config/locationTypeConfig.ts
export const LOCATION_TYPE_COLORS: Record<LocationType, string> = {
  farm_stand: 'green',
  fish_monger: 'blue',
  // ... etc
};
```

**Benefits:**
- Header component reduced from 600 → 300 lines
- Easier to test individual components
- Reusable chip component for mobile/desktop

---

### 3. Consolidate Product Config Files
**Impact:** Medium | **Effort:** Low

**Current State:**
- 8 separate product config files (`farmProducts.ts`, `cheeseProducts.ts`, etc.)
- Each ~100 lines
- Similar structure repeated

**Suggested Structure:**
```tsx
// src/config/products/index.ts - Single source of truth
export const PRODUCT_CONFIGS = {
  farm_stand: {
    products: [...],
    categories: [...],
    categoryOrder: [...]
  },
  cheese_shop: { ... },
  // ... etc
} as const;
```

**Benefits:**
- Reduce from 8 files → 1 file
- Easier to add new location types
- Centralized product management

---

### 4. Remove headerHeight Dynamic Calculation
**Impact:** Low | **Effort:** Low

**Current Issue:**
- `ListingsPanel.tsx` dynamically measures header height
- Uses ResizeObserver and effects
- No longer needed since we removed paddingTop

**Action:**
```tsx
// REMOVE these lines from ListingsPanel.tsx:
- const [headerHeight, setHeaderHeight] = useState(0);
- useEffect(() => { measureHeader... }, []);  // Lines 27-52
```

**Benefits:**
- Simpler component
- Less runtime overhead
- Fewer effects/observers

---

### 5. Optimize Virtual Scrolling Threshold
**Impact:** Medium | **Effort:** Low

**Current:**
```tsx
const VIRTUALIZATION_THRESHOLD = 20;
```

**Recommendation:**
- Current threshold: 20 items
- With MarkerClusterer working well, consider: 50-100 items
- Most users won't have >50 visible locations

**Benefits:**
- Simpler rendering for most users
- Virtual scrolling only when truly needed

---

## 🔍 Code Quality Improvements

### 6. Extract Overlay Navigation Logic
**Impact:** Low | **Effort:** Low

**Current:** Duplicated in 3 places in App.tsx:
```tsx
// Lines 295, 313, 210 - Same logic repeated
closeShopOverlays();
const searchParams = location.search;
navigate(`/all${searchParams}`, { replace: true });
```

**Refactor:**
```tsx
// src/hooks/useOverlayNavigation.ts
export const useOverlayNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const closeAndNavigateToList = useCallback(() => {
    const searchParams = location.search;
    navigate(`/all${searchParams}`, { replace: true });
  }, [location.search, navigate]);

  return { closeAndNavigateToList };
};
```

---

### 7. Simplify Feature Flag System
**Impact:** Medium | **Effort:** Medium

**Current Complexity:**
- Frontend flags: `VITE_ENABLE_*` in `.env`
- Backend flags: `ENABLE_*` in `.env`
- Two separate systems tracking same thing

**Simplification:**
```bash
# Option A: Single source of truth (backend only)
# Backend determines enabled types → send to frontend via API
GET /api/config → { enabledTypes: ['farm_stand', 'cheese_shop', ...] }

# Option B: Environment variable at build time only
# Hardcode enabled types in frontend build
```

**Benefits:**
- Less environment variable confusion
- Single source of truth
- Easier deployment

---

### 8. Bundle Size Analysis
**Impact:** High | **Effort:** Low

**Run bundle analyzer:**
```bash
npm run analyze
# Check dist/stats.html for large dependencies
```

**Common Culprits to Check:**
- Google Maps API (unavoidable, but check if we're importing too much)
- React Virtual (only ~10KB, good)
- Any duplicate dependencies
- Large icon files

**Quick Wins:**
- Lazy load overlay components ✅ (already done!)
- Use dynamic imports for rarely-used utils
- Tree-shake unused exports

---

## 🚀 Performance Optimizations

### 9. Memoize Expensive Calculations
**Impact:** Medium | **Effort:** Low

**Current Candidates:**

**A. Product Config Merging** (ProductFilters.tsx)
```tsx
// Already using useMemo ✅ - Good!
const productConfig = useMemo(() => {
  return getMergedProductConfigs(activeLocationTypes);
}, [activeLocationTypes]);
```

**B. Category Grouping** (could be further optimized)
```tsx
// Consider memoizing at config level instead of component level
export const getFiltersByCategory = memoize(
  (locationTypes: Set<LocationType>) => {
    // ... grouping logic
  }
);
```

---

### 10. Optimize Map Marker Updates
**Impact:** High | **Effort:** Medium

**Current State:**
- 228 locations with MarkerClusterer ✅
- Good performance already

**Potential Improvements:**
- **Debounce marker updates** when filters change rapidly
- **Only update changed markers** (diff old vs new)
- **Virtualize map markers** (only render markers in viewport + buffer)

**Example:**
```tsx
// src/hooks/useMapMarkers.ts
const debouncedLocations = useDebounce(currentlyDisplayedLocations, 150);

// Only update markers when debounced value changes
useEffect(() => {
  updateMarkers(debouncedLocations);
}, [debouncedLocations]);
```

---

## 📦 Architecture Improvements

### 11. Type-Safe Route Configuration
**Impact:** Medium | **Effort:** Medium

**Current:** Route paths scattered across codebase

**Better Approach:**
```tsx
// src/config/routes.ts
export const ROUTES = {
  home: '/all',
  notSure: '/not-sure',
  farmDetail: (slug: string) => `/farm-stand/${slug}`,
  cheeseDetail: (slug: string) => `/cheesemonger/${slug}`,
  // ... etc
} as const;

// Usage:
navigate(ROUTES.farmDetail('leary-farm'));
```

**Benefits:**
- Type-safe route generation
- Single source of truth for URLs
- Easier to refactor routes

---

### 12. Standardize Error Handling
**Impact:** Low | **Effort:** Medium

**Current:** Mix of try/catch, error states, ErrorBoundary

**Recommendation:**
```tsx
// src/hooks/useAsyncError.ts
export const useAsyncError = () => {
  const { showToast } = useToast();

  return useCallback((error: Error, context: string) => {
    console.error(`[${context}]`, error);
    showToast({
      message: `Failed to ${context}: ${error.message}`,
      type: 'error'
    });
  }, [showToast]);
};
```

---

## 🧪 Testing Improvements

### 13. Add Integration Tests
**Impact:** High | **Effort:** High

**Current:** Some unit tests, no integration tests

**High-Value Test Cases:**
```tsx
// tests/integration/filtering.test.tsx
describe('Location Filtering', () => {
  test('selecting farm stands shows only farm stands', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('Farm Stands'));
    expect(screen.getAllByTestId('shop-card'))
      .toHaveLength(farmStandCount);
  });
});

// tests/integration/overlays.test.tsx
describe('Shop Overlay Navigation', () => {
  test('closing overlay returns to filtered list view', async () => {
    // Navigate to farm detail
    // Close overlay
    // Assert URL is /all?lat=...
  });
});
```

---

## 📊 Data Management

### 14. Implement Data Caching Strategy
**Impact:** Medium | **Effort:** Medium

**Current:** Data loaded on every page refresh

**Options:**

**A. IndexedDB for Offline Support**
```tsx
// Cache location data in browser
import { openDB } from 'idb';

const cacheLocations = async (locations) => {
  const db = await openDB('phreshfoods', 1);
  await db.put('locations', locations, 'current');
};
```

**B. React Query for Smarter Fetching**
```tsx
const { data: locations } = useQuery({
  queryKey: ['locations'],
  queryFn: fetchLocations,
  staleTime: 1000 * 60 * 60, // 1 hour
  cacheTime: 1000 * 60 * 60 * 24, // 24 hours
});
```

**Benefits:**
- Faster subsequent page loads
- Offline support
- Automatic refetch strategies

---

## 🎨 UI/UX Polish

### 15. Add Loading Skeletons for Overlays
**Impact:** Low | **Effort:** Low

**Current:** Fallback shows generic "Loading..."

**Better:**
```tsx
const OverlaySkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

<Suspense fallback={<OverlaySkeleton />}>
  <ShopDetailsOverlay />
</Suspense>
```

---

## 🔐 Security & Best Practices

### 16. Move Google API Key to Backend
**Impact:** High | **Effort:** High

**Current Risk:**
- `VITE_GOOGLE_MAPS_API_KEY` exposed in frontend bundle
- Can be extracted and abused

**Solution:**
```tsx
// Proxy all Google Maps API calls through backend
// Frontend: fetch('/api/maps/places?query=...')
// Backend: Add API key server-side
```

**Note:** This is partially done for some endpoints, but frontend still uses API key directly for Google Maps SDK.

---

## 📈 Monitoring & Analytics

### 17. Add Performance Monitoring
**Impact:** Medium | **Effort:** Low

**Current:** Basic web-vitals logging to console

**Enhancements:**
```tsx
// Send metrics to analytics service
import { onCLS, onFID, onLCP } from 'web-vitals';

onLCP((metric) => {
  // Send to Google Analytics / Sentry
  gtag('event', 'web-vitals', {
    name: metric.name,
    value: Math.round(metric.value),
    metric_id: metric.id,
  });
});
```

---

## ✅ Priority Matrix

| Priority | Effort | Item | Impact |
|----------|--------|------|--------|
| 🔴 HIGH | Low | Remove unused AppContext | Clean architecture |
| 🔴 HIGH | Low | Remove headerHeight calculation | Simpler code |
| 🔴 HIGH | Low | Bundle size analysis | Performance |
| 🟡 MEDIUM | Medium | Extract Header components | Maintainability |
| 🟡 MEDIUM | Low | Consolidate product configs | Organization |
| 🟡 MEDIUM | Low | Type-safe routes | Developer experience |
| 🟢 LOW | Low | Extract overlay navigation hook | Code quality |
| 🟢 LOW | Medium | Standardize error handling | Consistency |

---

## 🎯 Recommended Next Steps

**Week 1: Quick Wins**
1. Remove unused AppContext
2. Remove headerHeight calculation
3. Run bundle analyzer
4. Extract overlay navigation hook

**Week 2: Architecture**
5. Consolidate product configs into single file
6. Extract LocationTypeChips component from Header
7. Implement type-safe route configuration

**Week 3: Performance**
8. Add integration tests for critical paths
9. Implement React Query or IndexedDB caching
10. Optimize map marker updates with debouncing

**Future: Security & Monitoring**
11. Move Google API key to backend-only
12. Add performance monitoring to analytics
13. Implement offline support

---

## 💡 General Code Quality Tips

1. **Consistent naming:** `handle*` for event handlers, `is*`/`has*` for booleans
2. **Early returns:** Prefer early returns over nested conditionals
3. **Extract magic numbers:** `ANIMATION_DURATION_MS = 200` instead of hardcoded `200`
4. **Use TypeScript strictly:** Enable `strict: true` in tsconfig if not already
5. **Component size:** Aim for <300 lines per component

---

**Questions or want to tackle any of these? Let me know which optimizations interest you most!**
