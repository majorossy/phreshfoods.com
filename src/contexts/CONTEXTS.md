# Context Architecture Documentation

## Overview

The application uses a domain-driven context architecture where state is split into focused, single-responsibility contexts. This improves performance by reducing unnecessary re-renders and makes the codebase more maintainable.

## Context Structure

```
src/contexts/
├── AppContext.tsx          # Legacy composite context (for backward compatibility)
├── AppProviders.tsx        # Composite provider wrapping all domain contexts
├── FarmDataContext.tsx     # Farm stand data & loading states
├── SearchContext.tsx       # Location search & radius
├── FilterContext.tsx       # Product filtering
├── UIContext.tsx          # UI state (overlays, modals, selected shop)
├── DirectionsContext.tsx  # Google Maps directions
└── ToastContext.tsx       # Toast notifications
```

## Domain Contexts

### FarmDataContext
**Purpose:** Manages farm stand data and loading states

**Hook:** `useFarmData()`

**State:**
- `allFarmStands: Shop[]` - All farm stands loaded from API
- `currentlyDisplayedShops: ShopWithDistance[]` - Filtered/sorted shops
- `isLoadingFarmStands: boolean` - Loading state
- `farmStandsError: string | null` - Error message if loading failed
- `setAllFarmStands` - Update all farm stands
- `setCurrentlyDisplayedShops` - Update displayed shops
- `retryLoadFarmStands()` - Retry loading farm stands

**Use when:**
- Accessing or updating farm stand data
- Checking loading states
- Handling farm data errors

**Example:**
```tsx
import { useFarmData } from '../contexts/FarmDataContext';

function MyComponent() {
  const { allFarmStands, isLoadingFarmStands, farmStandsError } = useFarmData();

  if (isLoadingFarmStands) return <div>Loading...</div>;
  if (farmStandsError) return <div>Error: {farmStandsError}</div>;

  return <div>{allFarmStands.length} farms found</div>;
}
```

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
**Purpose:** Manages product filter selections

**Hook:** `useFilters()`

**State:**
- `activeProductFilters: Record<string, boolean>` - Active filter selections
- `setActiveProductFilters()` - Update filters

**Use when:**
- Building filter UI components
- Accessing current filter selections
- Updating filter state

**Example:**
```tsx
import { useFilters } from '../contexts/FilterContext';

function ProductFilters() {
  const { activeProductFilters, setActiveProductFilters } = useFilters();

  const handleToggle = (filterId: string) => {
    setActiveProductFilters(prev => ({
      ...prev,
      [filterId]: !prev[filterId]
    }));
  };

  return <div>/* filter UI */</div>;
}
```

---

### UIContext
**Purpose:** Manages UI state like overlays, modals, and selected shop

**Hook:** `useUI()`

**State:**
- `selectedShop: Shop | null` - Currently selected farm stand
- `setSelectedShop()` - Update selected shop
- `isShopOverlayOpen: boolean` - Shop details overlay open
- `isSocialOverlayOpen: boolean` - Social/directions overlay open
- `openShopOverlays()` - Open overlays for a shop
- `closeShopOverlays()` - Close all overlays
- `isInitialModalOpen: boolean` - Initial search modal open
- `setIsInitialModalOpen()` - Update initial modal state

**Use when:**
- Managing overlay/modal visibility
- Accessing selected shop
- Opening/closing UI elements

**Example:**
```tsx
import { useUI } from '../contexts/UIContext';

function ShopCard({ shop }) {
  const { openShopOverlays } = useUI();

  return (
    <button onClick={() => openShopOverlays(shop, 'shop')}>
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
import { useFarmData } from '../contexts/FarmDataContext';
import { useSearch } from '../contexts/SearchContext';

function NewComponent() {
  const { allFarmStands } = useFarmData();
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
  const { allFarmStands } = useFarmData();
  const { currentRadius } = useSearch();
  const { activeProductFilters } = useFilters();

  // Component only re-renders when these specific domains change
}
```

### 3. Avoid Prop Drilling
```tsx
// ❌ Bad - passing context values through props
<ChildComponent farmStands={allFarmStands} />

// ✅ Good - use hook directly in child
function ChildComponent() {
  const { allFarmStands } = useFarmData();
}
```

### 4. Error Handling
All hooks throw errors if used outside their providers:

```tsx
function MyComponent() {
  const { allFarmStands } = useFarmData();
  // ✅ Throws helpful error if not wrapped in FarmDataProvider
}
```

## Testing

When testing components that use context hooks:

```tsx
import { render } from '@testing-library/react';
import { FarmDataProvider } from '../contexts/FarmDataContext';

test('component using useFarmData', () => {
  render(
    <FarmDataProvider>
      <MyComponent />
    </FarmDataProvider>
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
