# Context Architecture Documentation

## Overview

The application uses a domain-driven context architecture where state is split into focused, single-responsibility contexts. This improves performance by reducing unnecessary re-renders and makes the codebase more maintainable.

## Context Structure (7 Contexts)

```
src/contexts/
├── AppProviders.tsx           # Composite provider wrapping all domain contexts
├── LocationDataContext.tsx    # All location data & loading states (PRIMARY)
├── SearchContext.tsx          # Location search & radius
├── FilterContext.tsx          # Product filtering & location type filtering
├── UIContext.tsx              # UI state (overlays, modals, selected shop)
├── DirectionsContext.tsx      # Google Maps directions
├── ToastContext.tsx           # Toast notifications
├── TripPlannerContext.tsx     # Trip planning with multi-stop routes
└── FarmDataContext.tsx        # Legacy (exports useFarmData as alias)
```

## Domain Contexts

### LocationDataContext (Primary Data Context)
**Purpose:** Manages all location data (8 types) and loading states

**Hook:** `useLocationData()` (preferred) or `useFarmData()` (backwards-compatible alias)

**State:**
- `allLocations: Shop[]` - All locations loaded from API (all 8 types combined)
- `currentlyDisplayedLocations: ShopWithDistance[]` - Filtered/sorted locations with distances
- `isLoadingLocations: boolean` - Loading state
- `locationsError: string | null` - Error message if loading failed
- `setAllLocations` - Update all locations
- `setCurrentlyDisplayedLocations` - Update displayed locations
- `retryLoadLocations()` - Retry loading locations

**Use when:**
- Accessing or updating location data
- Checking loading states
- Handling data fetch errors

**Example:**
```tsx
import { useLocationData } from '../contexts/LocationDataContext';

function MyComponent() {
  const { allLocations, isLoadingLocations, locationsError } = useLocationData();

  if (isLoadingLocations) return <div>Loading...</div>;
  if (locationsError) return <div>Error: {locationsError}</div>;

  return <div>{allLocations.length} locations found</div>;
}
```

**Note:** `useFarmData()` is exported as an alias for backwards compatibility.

---

### SearchContext
**Purpose:** Manages location search, radius, and Google Maps API state

**Hook:** `useSearch()`

**State:**
- `lastPlaceSelectedByAutocomplete: AutocompletePlace | null` - Selected location
- `setLastPlaceSelectedByAutocompleteAndCookie()` - Update location and save to cookie
- `searchTerm: string` - Current search input
- `setSearchTerm()` - Update search term
- `currentRadius: number` - Search radius in miles
- `setCurrentRadius()` - Update radius
- `mapsApiReady: boolean` - Google Maps API loaded
- `mapViewTargetLocation: AutocompletePlace | null` - Location to center map on
- `setMapViewTargetLocation()` - Update map center

**Use when:**
- Building search/location components
- Accessing current search location or radius
- Checking if Google Maps API is ready

**Example:**
```tsx
import { useSearch } from '../contexts/SearchContext';

function SearchBar() {
  const {
    searchTerm,
    setSearchTerm,
    currentRadius,
    setCurrentRadius,
    mapsApiReady
  } = useSearch();

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      disabled={!mapsApiReady}
    />
  );
}
```

---

### FilterContext
**Purpose:** Manages product filter and location type filter selections

**Hook:** `useFilters()`

**State:**
- `activeProductFilters: Record<string, boolean>` - Active product filter selections
- `setActiveProductFilters()` - Update product filters
- `activeLocationTypes: Set<LocationType>` - Active location type filters (farm_stand, cheese_shop, etc.)
- `setActiveLocationTypes()` - Update location type filters

**Use when:**
- Building filter UI components
- Accessing current filter selections (products or location types)
- Updating filter state

**Example:**
```tsx
import { useFilters } from '../contexts/FilterContext';

function ProductFilters() {
  const { activeProductFilters, setActiveProductFilters, activeLocationTypes } = useFilters();

  const handleToggle = (filterId: string) => {
    setActiveProductFilters(prev => ({
      ...prev,
      [filterId]: !prev[filterId]
    }));
  };

  return <div>/* filter UI showing {activeLocationTypes.size} active types */</div>;
}
```

---

### UIContext
**Purpose:** Manages UI state like overlays, modals, selected/hovered shop

**Hook:** `useUI()`

**State:**
- `selectedShop: Shop | null` - Currently selected location
- `setSelectedShop()` - Update selected shop
- `hoveredShop: Shop | null` - Currently hovered location (for map preview)
- `setHoveredShop()` - Update hovered shop
- `isShopOverlayOpen: boolean` - Shop details overlay open
- `isSocialOverlayOpen: boolean` - Social/directions overlay open
- `isFilterDrawerOpen: boolean` - Filter drawer open (mobile)
- `setIsFilterDrawerOpen()` - Update filter drawer state
- `openShopOverlays()` - Open overlays for a shop
- `closeShopOverlays()` - Close all overlays
- `isInitialModalOpen: boolean` - Initial search modal open
- `setIsInitialModalOpen()` - Update initial modal state

**Use when:**
- Managing overlay/modal visibility
- Accessing selected or hovered shop
- Opening/closing UI elements (overlays, filter drawer)

**Example:**
```tsx
import { useUI } from '../contexts/UIContext';

function ShopCard({ shop }) {
  const { openShopOverlays, setHoveredShop } = useUI();

  return (
    <button
      onClick={() => openShopOverlays(shop, 'shop')}
      onMouseEnter={() => setHoveredShop(shop)}
      onMouseLeave={() => setHoveredShop(null)}
    >
      View Details
    </button>
  );
}
```

---

### DirectionsContext
**Purpose:** Manages Google Maps directions state and fetching

**Hook:** `useDirections()`

**State:**
- `directionsResult: google.maps.DirectionsResult | null` - Directions response
- `directionsError: string | null` - Error message
- `isFetchingDirections: boolean` - Loading state
- `fetchAndDisplayDirections()` - Fetch directions between two points
- `clearDirections()` - Clear current directions

**Use when:**
- Building directions UI
- Fetching route information
- Displaying turn-by-turn directions

**Example:**
```tsx
import { useDirections } from '../contexts/DirectionsContext';

function DirectionsPanel({ destination }) {
  const {
    directionsResult,
    isFetchingDirections,
    fetchAndDisplayDirections
  } = useDirections();

  const handleGetDirections = () => {
    fetchAndDisplayDirections('current location', destination);
  };

  return (
    <div>
      <button onClick={handleGetDirections} disabled={isFetchingDirections}>
        {isFetchingDirections ? 'Calculating...' : 'Get Directions'}
      </button>
      {directionsResult && <div>/* render directions */</div>}
    </div>
  );
}
```

---

### TripPlannerContext
**Purpose:** Manages trip planning with multi-stop routes

**Hook:** `useTripPlanner()`

**State:**
- `tripStops: TripStop[]` - Array of shops in the trip
- `isTripMode: boolean` - Trip planning mode active
- `setIsTripMode()` - Toggle trip mode
- `tripDirectionsResult: google.maps.DirectionsResult | null` - Multi-stop directions
- `isOptimizedRoute: boolean` - Whether route has been optimized
- `addStopToTrip(shop)` - Add a shop to the trip
- `removeStopFromTrip(stopId)` - Remove a stop from the trip
- `reorderStops(fromIndex, toIndex)` - Reorder stops (for drag-and-drop)
- `clearTrip()` - Clear all stops
- `optimizeRoute()` - Optimize stop order for shortest route

**Features:**
- URL encoding/decoding for shareable trip links
- localStorage persistence for draft trips
- Drag-to-reorder support via @dnd-kit

**Use when:**
- Building trip planning UI
- Adding/removing stops from trip
- Generating multi-stop directions

**Example:**
```tsx
import { useTripPlanner } from '../contexts/TripPlannerContext';

function TripButton({ shop }) {
  const { tripStops, addStopToTrip, isTripMode } = useTripPlanner();

  const isInTrip = tripStops.some(stop => stop.shop.slug === shop.slug);

  if (!isTripMode) return null;

  return (
    <button onClick={() => addStopToTrip(shop)} disabled={isInTrip}>
      {isInTrip ? 'In Trip' : 'Add to Trip'}
    </button>
  );
}
```

---

## Legacy AppContext

The `AppContext` is maintained for backward compatibility. It combines all domain contexts into a single interface.

**When to use:**
- Existing components that haven't been migrated yet
- When you need access to multiple domains in a single component

**When NOT to use:**
- New components (use specific domain hooks instead)
- Components that only need one or two domains

**Migration path:**
```tsx
// Old approach (avoid in new code)
import { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

function OldComponent() {
  const appContext = useContext(AppContext);
  const { allFarmStands, currentRadius } = appContext;
  // ...
}

// New approach (preferred)
import { useLocationData } from '../contexts/LocationDataContext';
import { useSearch } from '../contexts/SearchContext';

function NewComponent() {
  const { allLocations } = useLocationData();
  const { currentRadius } = useSearch();
  // ...
}
```

## Performance Benefits

Using specific hooks instead of `AppContext` provides performance benefits:

**Problem with monolithic context:**
```tsx
// Component re-renders whenever ANY part of AppContext changes
function MyComponent() {
  const { currentRadius } = useContext(AppContext);
  // Re-renders when farm data loads, filters change, UI state changes, etc.
}
```

**Solution with domain contexts:**
```tsx
// Component only re-renders when search domain changes
function MyComponent() {
  const { currentRadius } = useSearch();
  // Only re-renders when currentRadius or other search state changes
}
```

## Best Practices

### 1. Use the Most Specific Hook
```tsx
// ❌ Bad - subscribes to everything
const { activeProductFilters } = useContext(AppContext);

// ✅ Good - only subscribes to filter domain
const { activeProductFilters } = useFilters();
```

### 2. Combine Multiple Hooks When Needed
```tsx
// ✅ Good - use multiple specific hooks
function SearchResults() {
  const { allLocations } = useLocationData();
  const { currentRadius } = useSearch();
  const { activeProductFilters, activeLocationTypes } = useFilters();

  // Component only re-renders when these specific domains change
}
```

### 3. Avoid Prop Drilling
```tsx
// ❌ Bad - passing context values through props
<ChildComponent locations={allLocations} />

// ✅ Good - use hook directly in child
function ChildComponent() {
  const { allLocations } = useLocationData();
}
```

### 4. Error Handling
All hooks throw errors if used outside their providers:

```tsx
function MyComponent() {
  const { allLocations } = useLocationData();
  // ✅ Throws helpful error if not wrapped in LocationDataProvider
}
```

## Testing

When testing components that use context hooks:

```tsx
import { render } from '@testing-library/react';
import { LocationDataProvider } from '../contexts/LocationDataContext';

test('component using useLocationData', () => {
  render(
    <LocationDataProvider>
      <MyComponent />
    </LocationDataProvider>
  );
});
```

Or use the composite `AppProviders`:

```tsx
import { AppProviders } from '../contexts/AppProviders';

test('component using multiple hooks', () => {
  render(
    <AppProviders>
      <MyComponent />
    </AppProviders>
  );
});
```

**Note:** 8 context test files exist: `LocationDataContext.test.tsx`, `SearchContext.test.tsx`, `FilterContext.test.tsx`, `UIContext.test.tsx`, `DirectionsContext.test.tsx`, `ToastContext.test.tsx`, `TripPlannerContext.test.tsx`, `FarmDataContext.test.tsx`

## Migration Checklist

When migrating a component from `AppContext` to specific hooks:

1. ✅ Identify which domains the component uses
2. ✅ Import the specific hooks needed
3. ✅ Replace `useContext(AppContext)` with specific hooks
4. ✅ Remove unused imports
5. ✅ Test the component still works
6. ✅ Verify performance (should re-render less frequently)

## Future Improvements

Consider these enhancements:

- Add Redux DevTools integration for better debugging
- Implement context selectors for even more granular subscriptions
- Add TypeScript strict mode for better type safety
- Create custom hooks that combine common patterns
