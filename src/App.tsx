// src/App.tsx
import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useLocationData } from './contexts/LocationDataContext';
import { useSearch } from './contexts/SearchContext';
import { useFilters } from './contexts/FilterContext';
import { useUI } from './contexts/UIContext';
import { useFilteredShops } from './hooks/useFilteredShops';
import { useURLSync } from './hooks/useURLSync';
import { isTypeFilterPage } from './utils/typeUrlMappings';
import type { AutocompletePlace } from './types';
import { getCookie } from './utils/cookieHelper';
import { LAST_SEARCHED_LOCATION_COOKIE_NAME } from './config/appConfig';
import { initWebVitals, markPerformance, reportCustomMetric } from './utils/webVitals';
import {
  getHomepageSEO,
  getShopSEO,
  generateLocalBusinessSchema,
  generateOrganizationSchema,
  updateMetaTags,
  addStructuredData
} from './utils/seo';

import LazyLoadErrorBoundary from './components/LazyLoadErrorBoundary.tsx';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.tsx';

// Code splitting: Lazy load components to reduce initial bundle size
// These components are loaded on-demand, improving initial page load time
const Header = lazy(() => import('./components/Header/Header.tsx'));
const MapComponent = lazy(() => import('./components/Map/MapComponent.tsx'));
const MapSearchControls = lazy(() => import('./components/Map/MapSearchControls.tsx'));
const CardListings = lazy(() => import('./components/Listings/CardListings.tsx'));
const MobileBottomSheet = lazy(() => import('./components/Mobile/MobileBottomSheet.tsx'));
const ShopDetails = lazy(() => import('./components/Overlays/ShopDetails.tsx'));
const ShopSocials = lazy(() => import('./components/Overlays/ShopSocials.tsx'));

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Domain-specific hooks
  const { allLocations, setCurrentlyDisplayedLocations } = useLocationData();
  const { lastPlaceSelectedByAutocomplete, currentRadius, mapsApiReady, setLastPlaceSelectedByAutocompleteAndCookie, setMapViewTargetLocation } = useSearch();
  const { activeProductFilters, activeLocationTypes } = useFilters();
  const {
    selectedShop,
    isShopDetailsOpen,
    isShopSocialsOpen,
    shouldRenderShopDetails,
    shouldRenderShopSocials,
    isShopDetailsAnimatedOpen,
    isShopSocialsAnimatedOpen,
    openShopOverlays,
    closeShopOverlays,
    setSelectedShop,
    isFilterDrawerOpen,
    setIsManuallyCollapsed
  } = useUI();

  // Mobile detection for bottom sheet (Phase 1)
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Initialize Web Vitals monitoring on mount
  useEffect(() => {
    initWebVitals();
    markPerformance('app-initialized');
  }, []);

  // Handle window resize for mobile detection (Phase 1)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track custom metrics when shops are loaded
  useEffect(() => {
    if (allLocations && allLocations.length > 0) {
      reportCustomMetric('shops-loaded', allLocations.length, ' shops');
      markPerformance('shops-data-ready');
    }
  }, [allLocations]);

  // Sync filter/search state to URL parameters (with debouncing)
  useURLSync();

  // Use custom hook for filtering and sorting shops
  const filteredAndSortedShops = useFilteredShops({
    allLocations,
    activeProductFilters,
    activeLocationTypes,
    searchLocation: lastPlaceSelectedByAutocomplete,
    currentRadius,
    mapsApiReady,
  });

  // Update displayed shops when filtered results change
  // The setter function is stable (React guarantees setter function stability), but we include it
  // in the dependency array to satisfy the exhaustive-deps rule
  useEffect(() => {
    setCurrentlyDisplayedLocations(filteredAndSortedShops);
  }, [filteredAndSortedShops, setCurrentlyDisplayedLocations]);

  // Auto-populate search location when loading a direct shop URL
  useEffect(() => {
    const slugMatch = location.pathname.match(/^\/(farm-stand|cheesemonger|fishmonger|butcher|antique-shop|brewery|winery|sugar-shack)\/(.+)/);

    if (slugMatch && selectedShop && lastPlaceSelectedByAutocomplete === null && mapsApiReady) {
      // Check if there's a saved location in the cookie
      // If there is, don't overwrite it with the shop's address (user might be refreshing the page)
      const savedLocationCookie = getCookie(LAST_SEARCHED_LOCATION_COOKIE_NAME);
      if (savedLocationCookie) {
        // There's a saved search location - don't overwrite it
        // SearchContext will handle loading it
        return;
      }

      // User navigated directly to a farm URL and no search location is set anywhere
      // Create a search location based on the shop's address
      const shopAddress = selectedShop.placeDetails?.formatted_address || selectedShop.Address;

      if (selectedShop.lat && selectedShop.lng && shopAddress) {
        const autocompletePlace: AutocompletePlace = {
          formatted_address: shopAddress,
          geometry: {
            location: new google.maps.LatLng(selectedShop.lat, selectedShop.lng)
          },
          name: selectedShop.placeDetails?.name || selectedShop.Name
        };

        // Set the search location without showing the modal (already hidden by UIContext)
        setLastPlaceSelectedByAutocompleteAndCookie(autocompletePlace, shopAddress);
        setMapViewTargetLocation(autocompletePlace);
      }
    }
  }, [location.pathname, selectedShop, lastPlaceSelectedByAutocomplete, mapsApiReady, setLastPlaceSelectedByAutocompleteAndCookie, setMapViewTargetLocation]);

  // Handle direct navigation to shop detail pages, overlay closure, and map click deselection
  useEffect(() => {
    const slugMatch = location.pathname.match(/^\/(farm-stand|cheesemonger|fishmonger|butcher|antique-shop|brewery|winery|sugar-shack)\/(.+)/);

    if (slugMatch && slugMatch[2]) {
      const urlIdentifier = slugMatch[2];

      // Wait for location data to load before attempting to find the shop
      if (!allLocations || allLocations.length === 0) {
        // Data is still loading, don't redirect yet
        return;
      }

      // IMPORTANT: Look up shop from filteredAndSortedShops first (which has distance calculated)
      // Fall back to allLocations only if not found in filtered results
      const shopFromFiltered = filteredAndSortedShops.find(s => s.slug === urlIdentifier)
                            || filteredAndSortedShops.find(s => s.GoogleProfileID === urlIdentifier);

      const shopFromUrl = shopFromFiltered
                       || allLocations.find(s => s.slug === urlIdentifier)
                       || allLocations.find(s => s.GoogleProfileID === urlIdentifier);

      if (shopFromUrl) {
        if (!selectedShop || (selectedShop.slug !== shopFromUrl.slug && selectedShop.GoogleProfileID !== shopFromUrl.GoogleProfileID)) {
          setSelectedShop(shopFromUrl);
          setIsManuallyCollapsed(false); // New shop - clear collapse flag
          // Only open overlays on desktop - mobile uses bottom sheet
          if (!isMobile) {
            openShopOverlays(shopFromUrl);
          }
        } else if (!isShopDetailsOpen && !isShopSocialsOpen && !isMobile) {
          // Only open overlays on desktop - mobile uses bottom sheet
          openShopOverlays(selectedShop);
        }
      } else {
        // Shop not found - redirect to homepage
        navigate('/', { replace: true });
        if (isShopDetailsOpen || isShopSocialsOpen) closeShopOverlays();
        if (selectedShop) setSelectedShop(null);
      }
    } else if (location.pathname === '/' || isTypeFilterPage(location.pathname)) {
      // On homepage or type filter page - close any open overlays
      // Note: Don't clear selectedShop here - closeShopOverlays handles the delayed cleanup
      // This prevents the flicker during close animation
      if (isShopDetailsOpen || isShopSocialsOpen) {
        closeShopOverlays();
      }
    } else if (!selectedShop && location.pathname.match(/^\/(farm-stand|cheesemonger|fishmonger|butcher|antique-shop|brewery|winery|sugar-shack)\//)) {
      // Edge case: shop detail URL but no selected shop and data is loaded
      if (allLocations && allLocations.length > 0) {
        navigate('/', { replace: true });
        if (isShopDetailsOpen || isShopSocialsOpen) closeShopOverlays();
      }
    }
  }, [
      location.pathname, allLocations, filteredAndSortedShops, selectedShop, isShopDetailsOpen, isShopSocialsOpen,
      openShopOverlays, closeShopOverlays, setSelectedShop, navigate, isMobile, setIsManuallyCollapsed
    ]
  );

  // Keyboard listener for Escape key
  // Escape key handler to close overlays
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (isShopDetailsOpen || isShopSocialsOpen)) {
        // closeShopOverlays handles the delayed cleanup of selectedShop
        closeShopOverlays();
        // Navigate back to the list view, preserving query params
        const searchParams = location.search;
        navigate(`/all${searchParams}`, { replace: true });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isShopDetailsOpen, isShopSocialsOpen, closeShopOverlays, navigate, location.search]);

  // SEO: Update meta tags and structured data based on current route
  useEffect(() => {
    const slugMatch = location.pathname.match(/^\/farm\/(.+)/);

    if (slugMatch && selectedShop) {
      // Farm detail page - use shop-specific SEO
      const seoConfig = getShopSEO(selectedShop);
      updateMetaTags(seoConfig);

      // Add structured data for LocalBusiness
      const structuredData = generateLocalBusinessSchema(selectedShop);
      addStructuredData(structuredData);
    } else if (location.pathname === '/' || isTypeFilterPage(location.pathname)) {
      // Homepage or type filter page - use homepage SEO
      const seoConfig = getHomepageSEO();
      updateMetaTags(seoConfig);

      // Add Organization structured data for homepage
      const organizationSchema = generateOrganizationSchema();
      addStructuredData(organizationSchema);
    }
  }, [location.pathname, selectedShop]);

  return (
    <div id="app-container" className="h-screen flex flex-col">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      <ErrorBoundary>
        <Suspense fallback={<div className="bg-[#e8dcc3] shadow-md z-30 h-16 animate-pulse" />}>
          <Header />
        </Suspense>
      </ErrorBoundary>
      <main id="main-content" className="flex-grow flex overflow-hidden" role="main">
        <ErrorBoundary>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-gray-200 text-lg">Loading map...</div>}>
            <div className="flex-1 relative">
              {mapsApiReady ? <MapComponent /> : <div className="w-full h-full flex items-center justify-center bg-gray-200 text-lg">Loading Map API...</div>}
              {/* Map Search Controls - desktop only (lg+) */}
              {mapsApiReady && (
                <Suspense fallback={null}>
                  <MapSearchControls />
                </Suspense>
              )}
            </div>
          </Suspense>
        </ErrorBoundary>
        {/* Desktop/Tablet Listings Panel - hidden on mobile */}
        <ErrorBoundary>
          <Suspense fallback={<div className="hidden md:block md:w-2/5 lg:w-1/3 p-4 bg-white/80 animate-pulse z-10" />}>
            <div className="hidden md:block">
              <CardListings />
            </div>
          </Suspense>
        </ErrorBoundary>

        {/* Mobile Bottom Sheet - shown only on mobile and when filter drawer is closed */}
        {isMobile && !isFilterDrawerOpen && (
          <ErrorBoundary>
            <Suspense fallback={null}>
              <MobileBottomSheet />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Overlays - Desktop only (mobile uses bottom sheet) */}
        {!isMobile && shouldRenderShopDetails && selectedShop && (
          <LazyLoadErrorBoundary componentName="shop details">
            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
              <ShopDetails
                shop={selectedShop}
                isOpen={isShopDetailsAnimatedOpen}
                onClose={() => {
                  // Start close animation - don't clear selectedShop yet!
                  // The delayed unmount in UIContext will handle cleanup
                  closeShopOverlays();
                  // Navigate back to the list view, preserving query params
                  const searchParams = location.search;
                  navigate(`/all${searchParams}`, { replace: true });
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {!isMobile && shouldRenderShopSocials && selectedShop && (
          <LazyLoadErrorBoundary componentName="social media">
            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
              <ShopSocials
                shop={selectedShop}
                isOpen={isShopSocialsAnimatedOpen}
                onClose={() => {
                  // Start close animation - don't clear selectedShop yet!
                  // The delayed unmount in UIContext will handle cleanup
                  closeShopOverlays();
                  // Navigate back to the list view, preserving query params
                  const searchParams = location.search;
                  navigate(`/all${searchParams}`, { replace: true });
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
      </main>
      <Routes>
          {/* Root path - redirect to /not-sure (empty state for category browsing) */}
          <Route path="/" element={<Navigate to="/not-sure" replace />} />

          {/* Redirects from old URLs to new standardized URLs for backward compatibility */}
          <Route path="/farms" element={<Navigate to="/farm-stand" replace />} />
          <Route path="/cheese" element={<Navigate to="/cheesemonger" replace />} />
          <Route path="/fish" element={<Navigate to="/fishmonger" replace />} />
          <Route path="/butchers" element={<Navigate to="/butcher" replace />} />
          <Route path="/antiques" element={<Navigate to="/antique-shop" replace />} />
          <Route path="/breweries" element={<Navigate to="/brewery" replace />} />
          <Route path="/wineries" element={<Navigate to="/winery" replace />} />
          <Route path="/sugar-shacks" element={<Navigate to="/sugar-shack" replace />} />

          {/* Type filter pages - MUST come before detail pages to avoid conflicts */}
          {/* Now using consistent paths for both listings and details */}
          <Route path="/all" element={<React.Fragment />} />
          <Route path="/not-sure" element={<React.Fragment />} />
          <Route path="/farm-stand" element={<React.Fragment />} />
          <Route path="/cheesemonger" element={<React.Fragment />} />
          <Route path="/fishmonger" element={<React.Fragment />} />
          <Route path="/butcher" element={<React.Fragment />} />
          <Route path="/antique-shop" element={<React.Fragment />} />
          <Route path="/brewery" element={<React.Fragment />} />
          <Route path="/winery" element={<React.Fragment />} />
          <Route path="/sugar-shack" element={<React.Fragment />} />

          {/* Multi-type combinations (e.g., /farms+cheese) */}
          <Route path="/:types" element={<React.Fragment />} />

          {/* Shop detail pages */}
          <Route path="/farm-stand/:slug" element={<React.Fragment />} />
          <Route path="/cheesemonger/:slug" element={<React.Fragment />} />
          <Route path="/fishmonger/:slug" element={<React.Fragment />} />
          <Route path="/butcher/:slug" element={<React.Fragment />} />
          <Route path="/antique-shop/:slug" element={<React.Fragment />} />
          <Route path="/brewery/:slug" element={<React.Fragment />} />
          <Route path="/winery/:slug" element={<React.Fragment />} />
          <Route path="/sugar-shack/:slug" element={<React.Fragment />} />
      </Routes>
    </div>
  );
}

export default App;