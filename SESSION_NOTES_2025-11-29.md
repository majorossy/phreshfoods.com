# Session Notes - November 29, 2025

## Session Summary
Major refactoring session focusing on navigation, responsive layouts, mobile UX, and feature flags.

---

## ✅ Completed Features

### 1. `/not-sure` Route & Empty Filters Logic
**Status:** ✅ Working

**What was done:**
- Created `/not-sure` route that shows WelcomeState (category browsing)
- Implemented distinction between "empty filters" vs "clear filters":
  - **Empty filters** (no location types selected) → navigate to `/not-sure`
  - **Clear filters** (all types, no products) → navigate to `/all`
- Fixed logo click flash issue by:
  - Adding `e.preventDefault()` to prevent Link's default navigation
  - Preserving search location query params (lat/lng)
  - Adding screen width check in Header to prevent radius update conflicts

**Files modified:**
- `src/App.tsx` - Root redirect, `/not-sure` route
- `src/components/Listings/ListingsPanel.tsx` - Show WelcomeState only on `/not-sure`
- `src/contexts/FilterContext.tsx` - Initialize `/not-sure` with empty types, clearAllFilters logic
- `src/hooks/useURLSync.ts` - Empty vs clear navigation logic
- `src/components/Header/Header.tsx` - Logo click handler with preventDefault

---

### 2. Location Type Ordering
**Status:** ✅ Working

**What was done:**
- Updated canonical order in `ALL_LOCATION_TYPES`:
  1. Farm Stands
  2. Fishmongers
  3. Cheesemongers
  4. Butchers
  5. Wineries
  6. Antiques
  7. Sugar Shacks
  8. Breweries

- Updated `encodeTypesToPath()` to preserve this order (removed alphabetical `.sort()`)
- URLs now reflect UI order: `/farm-stand+fishmonger+cheesemonger` instead of alphabetical

**Files modified:**
- `src/types/shop.ts` - ALL_LOCATION_TYPES order
- `src/utils/typeUrlMappings.ts` - Removed .sort(), use ALL_LOCATION_TYPES order

---

### 3. Responsive Layout - Tablet View
**Status:** ✅ Working

**What was done:**
- Tablet (768-1024px): 1 column full-width shop cards
- Desktop (1024px+): 2 columns
- Updated Tailwind classes: `grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2`
- Updated JavaScript logic to use screen width instead of panel width

**Files modified:**
- `src/components/Listings/ListingsPanel.tsx` - Grid classes, column calculation logic

---

### 4. Mobile Carousel Complete Refactoring
**Status:** ✅ Working (mostly)

**What was done:**
- **Positioning:** Changed from scroll-based to transform-based (`translateX`)
- **Sizing:** 80% center card + 10% side peeks (instead of 92%/4%)
- **Navigation:** Arrow-only (disabled swipe/scroll gestures)
- **Visual hierarchy:**
  - Center card: `scale(1.2)`, bright, large shadow, NO overlay
  - Side cards: `scale(0.85)`, dark overlay (`bg-black/60`)
- **Conditional arrows:** Only show when not at first/last card
- **Consistent spacing:** All percentage units (no mixed px/%)

**Files modified:**
- `src/components/Mobile/HorizontalCarousel.tsx` - Complete rewrite
- `src/components/Mobile/MobileBottomSheet.tsx` - Added `overflow-visible`

**Technical approach:**
- Uses `centerIndex` state to track which card is centered
- Container transform: `translateX(calc(10% + ${offset}%))`
- Each card: `flex: 0 0 80%` + `marginRight: 10%`
- Offset calculation: `centerIndex * -90%`

---

### 5. Desktop Search & Radius Controls
**Status:** ✅ Working

**What was done:**
- Created new `MapSearchControls` component
- Positioned bottom-left over map (1024px+ only)
- Layout: Compact radius pill (left) + Search input (right)
- Prevented radius twitching by:
  - Header skips radius updates on desktop (>= 1024px)
  - Only MapSearchControls manages radius on large screens

**Files created:**
- `src/components/Map/MapSearchControls.tsx` - NEW

**Files modified:**
- `src/components/Header/Header.tsx` - Added `lg:hidden` to search/radius
- `src/App.tsx` - Lazy loaded and rendered MapSearchControls

---

### 6. Feature Flags for Location Types
**Status:** ⚠️ Partially Working (backend works, frontend still shows them)

**What was done:**
- Created environment variable-based feature flag system
- Added flags to `.env` and `.env.example`
- Backend correctly filters out disabled types
- Frontend reads env vars correctly but may need more work

**Files created:**
- `src/config/enabledLocationTypes.ts` - NEW

**Files modified:**
- `.env` - Added VITE_ENABLE_BREWERIES=false, ENABLE_BREWERIES=false, etc.
- `.env.example` - Documented feature flags
- `backend/server.js` - Conditional merging of location types
- `src/contexts/FilterContext.tsx` - Uses ENABLED_LOCATION_TYPES
- `src/hooks/useURLSync.ts` - Uses ENABLED_LOCATION_TYPES.length
- `src/components/Filters/ProductFilters.tsx` - Uses ENABLED_LOCATION_TYPES

**Current state:**
- Backend logs show: `[Feature Flags] Breweries: false Wineries: false`
- Frontend logs show env vars read correctly
- BUT breweries/wineries still appearing in UI

**What needs investigation:**
- Check all components using ALL_LOCATION_TYPES vs ENABLED_LOCATION_TYPES
- May need to update more files (WelcomeState, ListingsPanel, etc.)
- Data might be cached - may need to clear browser cache or force reload

---

## ⚠️ Known Issues to Fix Next Session

### Issue 1: Mobile Filter URL Sync on Detail Pages
**Problem:** When on a shop detail page (e.g., `/cheesemonger/portland-food-co-op`) on mobile, clicking filters in the mobile drawer doesn't update the URL.

**Root cause:** `useURLSync.ts` lines 52-56 block ALL URL updates on detail pages:
```tsx
if (location.pathname.includes('/') && location.pathname.split('/').filter(Boolean).length >= 2) {
  return; // Blocks URL sync on detail pages
}
```

**Solution needed:** When filters change on a detail page, navigate away to the filtered route. Add logic like:
```tsx
// Skip URL updates on detail pages UNLESS filters changed
const isDetailPage = location.pathname.split('/').filter(Boolean).length >= 2;
if (isDetailPage) {
  // Check if this is the initial mount or if filters actually changed
  // If filters changed, allow navigation away from detail page
  if (/* filters haven't changed */) {
    return;
  }
}
```

**Files to modify:**
- `src/hooks/useURLSync.ts`

---

### Issue 2: Breweries/Wineries Still Showing
**Problem:** Environment variables are read correctly, backend filters them out, but they still appear in frontend.

**Possible causes:**
1. Not all components updated to use ENABLED_LOCATION_TYPES
2. Frontend using cached API data
3. Some components still importing/using ALL_LOCATION_TYPES directly

**What to check:**
- Search for remaining `import.*ALL_LOCATION_TYPES` in src/
- Verify `/api/locations` endpoint returns filtered data
- Check browser Network tab to see API response
- May need to update:
  - `src/components/Listings/ListingsPanel.tsx` (still imports ALL_LOCATION_TYPES)
  - `src/utils/urlSync.ts` (still imports ALL_LOCATION_TYPES)
  - `src/utils/typeUrlMappings.ts` (still imports ALL_LOCATION_TYPES)

**Files to check/modify:**
- All files that import ALL_LOCATION_TYPES
- Verify API responses in Network tab

---

### Issue 3: Mobile Carousel Side Peeks Not Visible
**Problem:** HTML shows correct structure (cards positioned correctly, transforms applied), but user reports not seeing the side peeks visually.

**What was tried:**
- Added `overflow-visible` to HorizontalCarousel container
- Added `overflow-x-visible` to MobileBottomSheet content container
- Added `overflow-visible` to MobileBottomSheet itself
- All containers now allow overflow

**Possible causes:**
1. App.tsx or another ancestor has `overflow-hidden`
2. Browser rendering quirk with transform + overflow
3. Bottom sheet height/positioning clipping content
4. Z-index issues

**What to try next:**
- Inspect element in browser DevTools
- Check computed styles for overflow on all ancestors
- Try removing `rounded-t-2xl` from bottom sheet temporarily
- Check if `fixed` positioning on bottom sheet affects overflow

**Files to check:**
- `src/components/Mobile/MobileBottomSheet.tsx`
- `src/components/Mobile/HorizontalCarousel.tsx`
- `src/App.tsx` (check main container)

---

## 📊 Current State

### Environment
- **Dev server:** Running on http://localhost:5175/
- **Backend:** Port 3000
- **Node env:** development
- **Feature flags:** Breweries=false, Wineries=false (in .env)

### File Structure
```
src/
├── config/
│   └── enabledLocationTypes.ts (NEW - feature flags)
├── components/
│   ├── Map/
│   │   └── MapSearchControls.tsx (NEW - desktop search overlay)
│   └── Mobile/
│       ├── HorizontalCarousel.tsx (REFACTORED - transform-based)
│       └── MobileBottomSheet.tsx (MODIFIED - overflow-visible)
└── hooks/
    └── useURLSync.ts (MODIFIED - empty/clear filters logic)

backend/
└── server.js (MODIFIED - feature flag filtering)
```

### Routes
- `/` → Redirects to `/not-sure`
- `/not-sure` → WelcomeState (empty filters)
- `/all` → All enabled locations (clear filters)
- `/[type]` → Filtered by type
- `/[type]/[slug]` → Shop detail page

---

## 🔧 Quick Reference

### To Hide/Show Location Types
1. Edit `.env` file (lines 41-49)
2. Change `VITE_ENABLE_[TYPE]=false` to `true` (or vice versa)
3. Change `ENABLE_[TYPE]=false` to `true` (or vice versa)
4. Restart dev server: `npm run dev:full`

### To Debug URL Sync Issues
- Check browser console for `[useURLSync]` logs
- Look for early return conditions in `src/hooks/useURLSync.ts`
- Verify filter state changes are triggering the useEffect

### To Test Mobile Carousel
- Resize browser to < 768px width
- Check that arrows navigate between cards
- Verify side cards show ~10% peeks
- Check browser console for `[Carousel]` or `[EnabledLocationTypes]` logs

---

## 💡 Architecture Notes

### Filter State Flow
```
User action (click filter)
  ↓
FilterContext state update (activeLocationTypes, activeProductFilters)
  ↓
useURLSync useEffect triggers
  ↓
Checks: Empty? Clear? Filtered? Detail page?
  ↓
Navigates to appropriate route
```

### Mobile Carousel Positioning
```
Container: translateX(calc(10% + ${offset}%))
Offset: centerIndex * -90%

Example:
- centerIndex=0: translateX(10%)    → First card centered
- centerIndex=1: translateX(-80%)   → Second card centered
- centerIndex=2: translateX(-170%)  → Third card centered
```

### Feature Flags
```
.env: VITE_ENABLE_BREWERIES=false
  ↓
Frontend: import.meta.env.VITE_ENABLE_BREWERIES
  ↓
enabledLocationTypes.ts: Filters out disabled types
  ↓
ENABLED_LOCATION_TYPES exported (missing brewery/winery)
  ↓
Components use ENABLED_LOCATION_TYPES instead of ALL_LOCATION_TYPES
```

---

## 🚀 Next Steps (Priority Order)

1. **Fix mobile filter URL sync on detail pages** (High - UX issue)
   - Modify useURLSync early return logic
   - Allow navigation when filters change

2. **Complete brewery/winery hiding** (High - cost savings)
   - Find remaining ALL_LOCATION_TYPES usages
   - Verify API response excludes them
   - Test thoroughly

3. **Fix mobile carousel side peeks visibility** (Medium - polish)
   - Debug overflow hierarchy
   - Check browser DevTools computed styles
   - May need different positioning approach

4. **Remove debug console.logs** (Low - cleanup)
   - Remove logs from enabledLocationTypes.ts
   - Remove logs from FilterContext.tsx
   - Remove logs from useURLSync.ts

---

## 📖 Reference Commands

```bash
# Start dev server
npm run dev:full

# Type check
npm run typecheck

# Build
npm run build:frontend

# Process location data
npm run process-data

# Restart after .env changes
# Kill server (Ctrl+C) then:
npm run dev:full
```

---

## 🎯 Success Metrics

**Working:**
- ✅ Logo click preserves search params
- ✅ Empty filters → `/not-sure`
- ✅ Clear filters → `/all`
- ✅ Location type ordering in URLs
- ✅ Tablet 1-column layout
- ✅ Desktop search overlay
- ✅ Mobile arrow-only carousel
- ✅ Backend feature flags working

**Needs work:**
- ⚠️ Mobile filter URL sync on detail pages
- ⚠️ Breweries/wineries still showing in frontend
- ⚠️ Mobile carousel side peeks visibility

---

**End of Session Notes**
