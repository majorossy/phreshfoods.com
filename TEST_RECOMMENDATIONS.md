# Test Recommendations

**Generated:** 2025-11-29
**Current Coverage:** 14 test files, ~33 components
**Test Framework:** Vitest + React Testing Library

---

## 🔴 CRITICAL: High-Priority Tests to Write

### 1. Feature Flag System Tests
**Priority:** CRITICAL | **Effort:** Low | **File:** `src/config/enabledLocationTypes.test.ts`

**Why:** Zero test coverage for the feature flag system you just implemented!

```tsx
// src/config/enabledLocationTypes.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ENABLED_LOCATION_TYPES, isLocationTypeEnabled } from './enabledLocationTypes';

describe('enabledLocationTypes', () => {
  it('should include farm_stand by default (always enabled)', () => {
    expect(ENABLED_LOCATION_TYPES).toContain('farm_stand');
  });

  it('should exclude brewery when VITE_ENABLE_BREWERIES=false', () => {
    // Mock environment variable
    vi.stubGlobal('import.meta.env.VITE_ENABLE_BREWERIES', 'false');

    // Test that brewery is not in enabled types
    expect(isLocationTypeEnabled('brewery')).toBe(false);
  });

  it('should include sugar_shack when VITE_ENABLE_SUGAR_SHACKS=true', () => {
    expect(ENABLED_LOCATION_TYPES).toContain('sugar_shack');
  });

  it('should have correct count when breweries/wineries disabled', () => {
    // With breweries/wineries disabled, should have 6 types
    expect(ENABLED_LOCATION_TYPES.length).toBe(6);
  });
});
```

**Impact:** Prevents regressions when toggling location types.

---

### 2. MapSearchControls Component Tests
**Priority:** HIGH | **Effort:** Low | **File:** `src/components/Map/MapSearchControls.test.tsx`

**Why:** New component with no tests!

```tsx
// src/components/Map/MapSearchControls.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MapSearchControls from './MapSearchControls';
import { AppProviders } from '../../contexts/AppProviders';

const renderComponent = () => {
  return render(
    <AppProviders>
      <MapSearchControls />
    </AppProviders>
  );
};

describe('MapSearchControls', () => {
  it('should render search input', () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('should render radius slider', () => {
    renderComponent();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should update radius when slider changes', () => {
    renderComponent();
    const slider = screen.getByRole('slider') as HTMLInputElement;

    fireEvent.change(slider, { target: { value: '50' } });

    expect(slider.value).toBe('50');
  });
});
```

---

### 3. Mobile Bottom Sheet Tests
**Priority:** HIGH | **Effort:** Medium | **File:** `src/components/Mobile/MobileBottomSheet.test.tsx`

**Why:** Complex mobile UI with snap points, no tests!

```tsx
// src/components/Mobile/MobileBottomSheet.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MobileBottomSheet from './MobileBottomSheet';
import { AppProviders } from '../../contexts/AppProviders';

const mockShop = {
  type: 'farm_stand' as const,
  Name: 'Test Farm',
  Address: '123 Main St',
  slug: 'test-farm',
  lat: 43.6591,
  lng: -70.2568,
  products: { beef: true, eggs: true }
};

describe('MobileBottomSheet', () => {
  it('should not render when no shop selected', () => {
    render(
      <AppProviders>
        <MobileBottomSheet />
      </AppProviders>
    );

    expect(screen.queryByText('Test Farm')).not.toBeInTheDocument();
  });

  it('should render horizontal carousel when collapsed', () => {
    // Test with selectedShop in context
    // Verify carousel is shown at 30% height
  });

  it('should render QuickShopInfo when expanded to 50%', () => {
    // Test with bottomSheetHeight = 0.5
    // Verify QuickShopInfo component appears
  });

  it('should handle snap point changes', () => {
    // Test drag interactions
    // Verify height updates correctly
  });
});
```

---

### 4. Overlay Close Navigation Tests
**Priority:** HIGH | **Effort:** Low | **File:** Update `src/App.test.tsx` or create integration test

**Why:** You just fixed the /not-sure flash bug - add regression test!

```tsx
// src/App.test.tsx (or new integration test)
describe('Overlay Navigation', () => {
  it('should navigate to /all with query params when closing shop overlay', async () => {
    // 1. Navigate to shop detail with query params
    const { user } = renderApp();

    // Simulate being on: /farm-stand/leary-farm?lat=43.50&lng=-70.45&radius=30
    window.history.pushState({}, '', '/farm-stand/leary-farm?lat=43.50&lng=-70.45&radius=30');

    // 2. Click close button (X)
    const closeButton = await screen.findByLabelText(/close/i);
    await user.click(closeButton);

    // 3. Verify navigation to /all with preserved params
    expect(window.location.pathname).toBe('/all');
    expect(window.location.search).toContain('lat=43.50');
    expect(window.location.search).toContain('lng=-70.45');
    expect(window.location.search).toContain('radius=30');
  });

  it('should NOT flash to /not-sure when closing overlay', async () => {
    // Monitor navigation calls
    const navigateSpy = vi.fn();

    // Close overlay
    // Verify navigateSpy was called exactly once with '/all?...'
    // NOT called with '/not-sure'
    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(
      expect.stringContaining('/all'),
      expect.anything()
    );
  });

  it('should navigate to /all when pressing Escape key', async () => {
    // Open shop overlay
    // Press Escape
    // Verify navigation preserves query params
  });
});
```

---

### 5. Location Type Filter Integration Tests
**Priority:** HIGH | **Effort:** Medium | **File:** New integration test

**Why:** Core feature - filtering by location type - has no integration test!

```tsx
// src/tests/integration/locationTypeFiltering.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { BrowserRouter } from 'react-router-dom';

describe('Location Type Filtering', () => {
  it('should only show enabled location types in filters', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Should see enabled types
    expect(screen.getByText('Farm Stands')).toBeInTheDocument();
    expect(screen.getByText('Cheesemongers')).toBeInTheDocument();
    expect(screen.getByText('Sugar Shacks')).toBeInTheDocument();

    // Should NOT see disabled types
    expect(screen.queryByText('Breweries')).not.toBeInTheDocument();
    expect(screen.queryByText('Wineries')).not.toBeInTheDocument();
  });

  it('should filter shops when selecting farm stands only', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><App /></BrowserRouter>);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Click farm stands filter chip
    const farmStandChip = screen.getByLabelText(/farm stand/i);
    await user.click(farmStandChip);

    // Verify only farm stands shown
    const shopCards = screen.getAllByTestId('shop-card');
    shopCards.forEach(card => {
      expect(card).toHaveTextContent(/farm/i);
    });
  });

  it('should update URL when toggling location types', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><App /></BrowserRouter>);

    // Click cheese shop filter
    const cheeseChip = screen.getByLabelText(/cheese/i);
    await user.click(cheeseChip);

    // URL should update
    await waitFor(() => {
      expect(window.location.pathname).toContain('cheese');
    });
  });
});
```

---

## 🟡 MEDIUM: Important Tests to Add

### 6. Header Layout Tests (After Refactoring)
**Priority:** MEDIUM | **Effort:** Low | **File:** Update `src/components/Header/Header.test.tsx`

**What to add:**
```tsx
describe('Header Layout', () => {
  it('should render only enabled location type chips', () => {
    renderComponent();

    // Count location type buttons
    const typeButtons = screen.getAllByRole('button', {
      name: /show|hide.*locations?/i
    });

    // Should be 6 (not 8) with breweries/wineries disabled
    expect(typeButtons).toHaveLength(6);
  });

  it('should not have flex-1 class (should use natural width)', () => {
    const { container } = renderComponent();

    const mainContainer = container.querySelector('[role="search"]');
    expect(mainContainer?.className).not.toContain('flex-1');
  });
});
```

---

### 7. ProductFilters Dynamic Rendering Tests
**Priority:** MEDIUM | **Effort:** Low | **File:** Update existing `ProductFilters.test.tsx`

**What to add:**
```tsx
describe('ProductFilters - Feature Flags', () => {
  it('should dynamically render location types from ENABLED_LOCATION_TYPES', () => {
    renderComponent();

    // Count checkboxes in Location Types section
    const locationTypeCheckboxes = screen.getAllByLabelText(/show.*\w+$/i);

    // Should match ENABLED_LOCATION_TYPES.length (6 types)
    expect(locationTypeCheckboxes).toHaveLength(6);
  });

  it('should not render brewery or winery checkboxes', () => {
    renderComponent();

    expect(screen.queryByLabelText(/show breweries/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/show wineries/i)).not.toBeInTheDocument();
  });

  it('should render checkboxes with correct display names', () => {
    renderComponent();

    // Verify display names come from getDisplayName utility
    expect(screen.getByText('Farm Stands')).toBeInTheDocument();
    expect(screen.getByText('Cheesemongers')).toBeInTheDocument();
  });
});
```

---

### 8. ListingsPanel Layout Tests
**Priority:** MEDIUM | **Effort:** Low | **File:** New file `src/components/Listings/ListingsPanel.test.tsx`

**What to test:**
```tsx
describe('ListingsPanel Layout', () => {
  it('should not have top padding', () => {
    const { container } = renderComponent();

    const panel = container.querySelector('#listingsPanel');
    const styles = window.getComputedStyle(panel);

    expect(styles.paddingTop).toBe('0px');
  });

  it('should use px-3 pb-3 classes (no pt-)', () => {
    const { container } = renderComponent();

    const panel = container.querySelector('#listingsPanel');
    expect(panel?.className).toContain('px-3');
    expect(panel?.className).toContain('pb-3');
    expect(panel?.className).not.toContain('pt-');
  });

  it('should enable virtual scrolling when > 20 items', () => {
    // Mock 50 locations
    // Verify virtual scrolling is enabled
  });
});
```

---

## 🟢 LOW: Nice-to-Have Tests

### 9. UIContext Tests
**Priority:** LOW | **Effort:** Medium

Test the complex overlay state management:
- Opening/closing overlays
- selectedShop cleanup timing
- Bottom sheet height management

### 10. DirectionsContext Tests
**Priority:** LOW | **Effort:** Low

Test directions fetching and error handling.

### 11. Toast Notification Tests
**Priority:** LOW | **Effort:** Low

Test toast display, auto-dismiss, multiple toasts.

---

## 📊 Test Coverage Analysis

**Current State:**
```
Tested Components (5):
✅ ErrorBoundary
✅ Header
✅ ProductFilters
✅ ShopCard
✅ ShopDetailsOverlay

Untested Components (28):
❌ MapComponent (critical!)
❌ MobileBottomSheet (critical!)
❌ SocialOverlay (critical!)
❌ MapSearchControls (new component!)
❌ QuickShopInfo (new component!)
❌ HorizontalCarousel
❌ ListingsPanel (has shopFilters tests but not component tests)
... and 21 more
```

**Contexts:**
```
✅ FilterContext (13 tests)
✅ FarmDataContext (8 tests)
✅ SearchContext (11 tests)
❌ UIContext (0 tests)
❌ DirectionsContext (0 tests)
❌ ToastContext (0 tests)
❌ LocationDataContext (0 tests)
❌ TripPlannerContext (0 tests)
```

**Utils:**
```
✅ typeUrlMappings (tested)
✅ requestCache (tested)
✅ retry (tested)
✅ cookieHelper (tested)
✅ shopFilters (tested)
✅ apiService (tested)
❌ seo utils (0 tests)
❌ socialMediaHelpers (0 tests)
❌ storageValidation (0 tests)
```

---

## 🎯 Recommended Testing Priority

### This Week: Critical Path Tests (4-6 hours)
1. **Feature flag tests** (30 min) - Prevent brewery/winery from showing when disabled
2. **Overlay navigation tests** (1 hour) - Prevent /not-sure flash regression
3. **Location type filtering integration** (2 hours) - Core user flow
4. **MapSearchControls** (1 hour) - New component needs coverage

### Next Week: Component Tests (6-8 hours)
5. **MobileBottomSheet** (2 hours) - Complex mobile UI
6. **QuickShopInfo** (1 hour) - New mobile component
7. **ListingsPanel layout** (1 hour) - Verify padding removal
8. **Header layout** (1 hour) - Verify natural width
9. **SocialOverlay** (2 hours) - Social media integration

### Future: Context & Utils (8-10 hours)
10. **UIContext** (3 hours) - Complex state management
11. **LocationDataContext** (2 hours) - Data loading and filtering
12. **SEO utils** (2 hours) - Meta tag generation
13. **Social media helpers** (1 hour) - URL construction

---

## 🚀 Quick Start: Write Your First Test

**Most valuable test to write RIGHT NOW:**

```bash
# Create the feature flag test
touch src/config/enabledLocationTypes.test.ts
```

```tsx
import { describe, it, expect } from 'vitest';
import { ENABLED_LOCATION_TYPES, isLocationTypeEnabled } from './enabledLocationTypes';

describe('Feature Flags - Location Types', () => {
  it('should not include brewery when disabled', () => {
    expect(ENABLED_LOCATION_TYPES).not.toContain('brewery');
  });

  it('should not include winery when disabled', () => {
    expect(ENABLED_LOCATION_TYPES).not.toContain('winery');
  });

  it('should include sugar_shack when enabled', () => {
    expect(ENABLED_LOCATION_TYPES).toContain('sugar_shack');
  });

  it('should have exactly 6 enabled types', () => {
    // farm_stand, cheese_shop, fish_monger, butcher, antique_shop, sugar_shack
    expect(ENABLED_LOCATION_TYPES.length).toBe(6);
  });

  it('isLocationTypeEnabled should return false for brewery', () => {
    expect(isLocationTypeEnabled('brewery')).toBe(false);
  });

  it('isLocationTypeEnabled should return true for farm_stand', () => {
    expect(isLocationTypeEnabled('farm_stand')).toBe(true);
  });
});
```

**Run it:**
```bash
npm run test:run
```

**Time:** 10 minutes to write + run
**Impact:** Prevents brewery/winery from accidentally showing up again

---

## 📈 Coverage Goals

**Current:** ~40% component coverage (estimate)
**Target:** 70% component coverage

**Focus areas:**
- 🔴 Critical user flows (filtering, overlay navigation)
- 🔴 New components (MapSearchControls, feature flags)
- 🟡 Mobile components (bottom sheet, carousel)
- 🟢 Edge cases (error states, loading states)

---

**Ready to write tests? I can help you implement any of these!**
