# Element Naming Convention

This document defines the naming standards for HTML elements across the PhreshFoods codebase. Consistent naming improves debugging, testing, and accessibility.

## Why Element Naming Matters

1. **DevTools Debugging**: Named elements appear clearly in the Elements panel
2. **E2E Testing**: `data-testid` attributes let Cypress/Playwright find elements reliably
3. **Analytics**: `data-section` attributes help track user interactions by feature area
4. **Accessibility**: IDs enable proper `aria-labelledby` and `aria-controls` relationships
5. **Code Maintenance**: Developers can quickly locate elements in the DOM

---

## Naming Conventions

### 1. Element IDs (`id=""`)

Use **kebab-case** for all IDs. IDs should be descriptive and indicate purpose.

#### Pattern: `{feature}-{element-type}`

```tsx
// Containers/Sections
id="shop-details-overlay"
id="social-overlay"
id="listings-panel"
id="mobile-bottom-sheet"
id="filter-drawer"
id="trip-planner-panel"

// Buttons/Controls
id="filter-toggle-button"
id="search-clear-button"
id="overlay-close-button"
id="accordion-info-button"
id="tab-reviews-button"

// Content Panels
id="shop-info-panel"
id="shop-products-panel"
id="directions-panel"
id="reviews-section"

// Form Inputs
id="search-location-input"
id="directions-origin-input"
id="radius-select"

// Headings (for aria-labelledby)
id="shop-name-heading"
id="section-title-heading"
id="modal-title"
```

#### Rules for IDs:
- ✅ Use for major containers that need JavaScript references
- ✅ Use when `aria-labelledby` or `aria-controls` needs a target
- ✅ Use for form inputs (required for `<label htmlFor="">`)
- ❌ Don't use for repeated elements (use `data-testid` instead)
- ❌ Don't include dynamic values in IDs (makes them unpredictable)

---

### 2. Test Selectors (`data-testid=""`)

Use **kebab-case**. These are specifically for automated testing (Cypress, Playwright, etc.).

#### Pattern: `{component}-{element}`

```tsx
// Cards and List Items
data-testid="shop-card"
data-testid="product-icon"
data-testid="filter-chip"
data-testid="trip-stop"

// Interactive Elements
data-testid="shop-card-image"
data-testid="shop-card-name"
data-testid="shop-card-distance"
data-testid="star-rating"
data-testid="product-checkbox"
data-testid="clear-filters-button"

// Status/State Elements
data-testid="loading-spinner"
data-testid="error-message"
data-testid="empty-state"
data-testid="toast-notification"

// Form Elements
data-testid="search-input"
data-testid="radius-dropdown"
data-testid="submit-button"
```

#### Rules for data-testid:
- ✅ Add to all interactive elements (buttons, inputs, links)
- ✅ Add to elements that display dynamic data (prices, ratings, names)
- ✅ Add to repeated elements (cards, list items, icons)
- ✅ Keep names stable - don't change them without updating tests
- ❌ Don't include dynamic values (use `data-shop-slug` separately)

---

### 3. Section Tracking (`data-section=""`)

Use **kebab-case**. These help identify feature areas for debugging and analytics.

#### Pattern: `{feature-area}`

```tsx
// Major Feature Sections
data-section="map-view"
data-section="listings-panel"
data-section="shop-details"
data-section="social-overlay"
data-section="filter-controls"
data-section="trip-planner"
data-section="mobile-bottom-sheet"

// Sub-sections
data-section="map-controls"
data-section="search-bar"
data-section="product-filters"
data-section="location-type-filters"
data-section="directions-form"
```

#### Rules for data-section:
- ✅ Add to major container divs
- ✅ Use for analytics event tracking boundaries
- ✅ Helpful for "what section is this element in?" debugging
- ❌ Don't nest too deeply (2 levels max)

---

### 4. Dynamic Data Attributes

For elements that need to carry context (like which shop a card represents):

```tsx
// Shop identification
data-shop-slug="hillside-farm"
data-shop-type="farm_stand"

// Filter identification
data-filter-id="beef"
data-filter-category="meat"

// Tab/Accordion identification
data-tab-id="reviews"
data-accordion-id="products"
```

---

## Component Checklist

### Priority 1: High-Traffic Components (Do First)

| Component | File | IDs Needed | data-testid Needed | data-section |
|-----------|------|------------|-------------------|--------------|
| ShopCard | `Listings/ShopCard.tsx` | - | `shop-card`, `shop-card-image`, `shop-card-name`, `shop-card-distance`, `shop-card-rating` | `shop-card` |
| MapComponent | `Map/MapComponent.tsx` | `map-container` | `map-canvas`, `map-loading` | `map-view` |
| ListingsPanel | `Listings/ListingsPanel.tsx` | `listings-panel` ✅ | `listings-container`, `listings-count`, `shop-list` | `listings-panel` |
| Header | `Header/Header.tsx` | `main-header` | `search-input`, `location-type-toggle`, `filter-button` | `header`, `search-bar` |
| ShopDetailsOverlay | `Overlays/ShopDetailsOverlay.tsx` | Most exist ✅ | `overlay-close-button`, `accordion-trigger`, `product-grid` | `shop-details` |
| SocialOverlay | `Overlays/SocialOverlay.tsx` | Most exist ✅ | `tab-button`, `directions-form`, `review-card` | `social-overlay` |

### Priority 2: Filter Components

| Component | File | IDs Needed | data-testid Needed | data-section |
|-----------|------|------------|-------------------|--------------|
| ProductFilters | `Filters/ProductFilters.tsx` | `filter-panel` | `filter-category`, `filter-checkbox`, `clear-filters-button` | `product-filters` |
| ProductFilterDropdown | `Header/ProductFilterDropdown.tsx` | `filter-dropdown` | `dropdown-trigger`, `filter-option` | `filter-dropdown` |

### Priority 3: Mobile Components

| Component | File | IDs Needed | data-testid Needed | data-section |
|-----------|------|------------|-------------------|--------------|
| MobileBottomSheet | `Mobile/MobileBottomSheet.tsx` | `mobile-bottom-sheet` | `sheet-handle`, `sheet-content` | `mobile-bottom-sheet` |
| HorizontalCarousel | `Mobile/HorizontalCarousel.tsx` | `product-carousel` | `carousel-item`, `carousel-nav` | `product-carousel` |
| QuickShopInfo | `Mobile/QuickShopInfo.tsx` | `quick-shop-info` | `quick-info-name`, `quick-info-distance` | `quick-shop-info` |
| ShopCardMobile | `Mobile/ShopCardMobile.tsx` | - | `mobile-shop-card`, `mobile-card-image` | `mobile-shop-card` |

### Priority 4: UI Components

| Component | File | IDs Needed | data-testid Needed | data-section |
|-----------|------|------------|-------------------|--------------|
| ProductIconGrid | `UI/ProductIconGrid.tsx` | - | `product-icon`, `product-icon-available`, `product-icon-unavailable` | - |
| StarRating | `UI/StarRating.tsx` | - | `star-rating`, `star-rating-value` | - |
| OpeningHoursDisplay | `UI/OpeningHoursDisplay.tsx` | - | `opening-hours`, `hours-status` | - |
| Toast | `UI/Toast.tsx` | `toast-container` | `toast-message`, `toast-close` | - |
| EmptyState | `UI/EmptyState.tsx` | - | `empty-state`, `empty-state-message` | - |
| Button | `UI/Button.tsx` | - | (inherits from usage) | - |
| StatusBadge | `UI/StatusBadge.tsx` | - | `status-badge` | - |

### Priority 5: Other Components

| Component | File | IDs Needed | data-testid Needed | data-section |
|-----------|------|------------|-------------------|--------------|
| InitialSearchModal | `Overlays/InitialSearchModal.tsx` | Exists ✅ | `modal-search-input`, `modal-skip-button`, `modal-search-button` | `initial-modal` |
| TripPlannerPanel | `TripPlanner/TripPlannerPanel.tsx` | `trip-planner` | `trip-stop`, `optimize-route-button`, `clear-trip-button` | `trip-planner` |
| ErrorBoundary | `ErrorBoundary/ErrorBoundary.tsx` | - | `error-boundary`, `error-message`, `retry-button` | - |
| InfoWindowContent | `Map/InfoWindowContent.tsx` | - | `info-window`, `info-window-name` | - |

---

## Implementation Examples

### Before (No naming):
```tsx
<div className="bg-white rounded-lg shadow-md p-4">
  <img src={shop.image} className="w-full h-48 object-cover" />
  <h3 className="text-lg font-semibold">{shop.name}</h3>
  <p className="text-gray-600">{shop.distance}</p>
  <button onClick={handleClick} className="bg-blue-500 text-white px-4 py-2">
    View Details
  </button>
</div>
```

### After (Properly named):
```tsx
<div
  className="bg-white rounded-lg shadow-md p-4"
  data-testid="shop-card"
  data-section="shop-card"
  data-shop-slug={shop.slug}
>
  <img
    src={shop.image}
    className="w-full h-48 object-cover"
    data-testid="shop-card-image"
    alt={`${shop.name} storefront`}
  />
  <h3
    className="text-lg font-semibold"
    data-testid="shop-card-name"
  >
    {shop.name}
  </h3>
  <p
    className="text-gray-600"
    data-testid="shop-card-distance"
  >
    {shop.distance}
  </p>
  <button
    onClick={handleClick}
    className="bg-blue-500 text-white px-4 py-2"
    data-testid="shop-card-details-button"
    aria-label={`View details for ${shop.name}`}
  >
    View Details
  </button>
</div>
```

---

## Accessibility Pairing

When adding IDs, ensure proper ARIA relationships:

```tsx
// Accordion pattern
<button
  id="accordion-products-button"
  aria-expanded={isOpen}
  aria-controls="accordion-products-panel"
  data-testid="accordion-trigger"
>
  Products
</button>
<div
  id="accordion-products-panel"
  role="region"
  aria-labelledby="accordion-products-button"
  data-testid="accordion-panel"
>
  {/* content */}
</div>

// Tab pattern
<div role="tablist" aria-label="Shop information tabs">
  <button
    id="tab-reviews"
    role="tab"
    aria-selected={activeTab === 'reviews'}
    aria-controls="tabpanel-reviews"
    data-testid="tab-button"
    data-tab-id="reviews"
  >
    Reviews
  </button>
</div>
<div
  id="tabpanel-reviews"
  role="tabpanel"
  aria-labelledby="tab-reviews"
  data-testid="tab-panel"
>
  {/* content */}
</div>

// Modal/Dialog pattern
<div
  id="shop-details-overlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="shop-name-heading"
  data-testid="shop-details-overlay"
  data-section="shop-details"
>
  <h2 id="shop-name-heading" data-testid="shop-name">
    {shop.name}
  </h2>
</div>
```

---

## Testing Usage Examples

### Cypress:
```javascript
// Find by data-testid
cy.get('[data-testid="shop-card"]').first().click();
cy.get('[data-testid="search-input"]').type('Portland');
cy.get('[data-testid="star-rating"]').should('contain', '4.5');

// Find by data-section for broader queries
cy.get('[data-section="listings-panel"]').within(() => {
  cy.get('[data-testid="shop-card"]').should('have.length.gte', 5);
});

// Find specific shop by slug
cy.get('[data-shop-slug="hillside-farm"]').click();
```

### Playwright:
```javascript
// Find by data-testid
await page.getByTestId('shop-card').first().click();
await page.getByTestId('search-input').fill('Portland');

// Using locators
const listings = page.locator('[data-section="listings-panel"]');
await expect(listings.getByTestId('shop-card')).toHaveCount(10);
```

---

## DevTools Debugging Tips

With proper naming, debugging becomes much easier:

1. **Find element by ID**:
   - Elements panel → Ctrl+F → `#shop-details-overlay`

2. **Find all test elements**:
   - Console → `$$('[data-testid]')` → Lists all testable elements

3. **Find elements in a section**:
   - Console → `$$('[data-section="listings-panel"] [data-testid]')`

4. **Quick element inspection**:
   - Right-click any element → Copy → Copy selector
   - Named elements give meaningful selectors vs `div > div > div`

---

## Migration Progress Tracker

Use this to track implementation progress:

- [ ] **Phase 1**: ShopCard, MapComponent, ListingsPanel, Header (core UX)
- [ ] **Phase 2**: ProductFilters, ProductFilterDropdown (filtering)
- [ ] **Phase 3**: MobileBottomSheet, HorizontalCarousel, QuickShopInfo, ShopCardMobile (mobile)
- [ ] **Phase 4**: UI components (ProductIconGrid, StarRating, etc.)
- [ ] **Phase 5**: Remaining components and edge cases

---

## Summary

| Attribute | Purpose | Format | Example |
|-----------|---------|--------|---------|
| `id` | JS references, ARIA targets | kebab-case | `id="shop-details-overlay"` |
| `data-testid` | E2E test selectors | kebab-case | `data-testid="shop-card"` |
| `data-section` | Feature area tracking | kebab-case | `data-section="listings-panel"` |
| `data-{context}-{key}` | Dynamic context data | kebab-case | `data-shop-slug="hillside-farm"` |

**Remember**: Names should be **stable**, **descriptive**, and **predictable**. A developer or test should be able to guess the name based on what the element does.
