// src/App.tsx
import React, { useEffect, useMemo, lazy, Suspense } from 'react';
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
import {
  getHomepageSEO,
  getFarmStandSEO,
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
const ListingsPanel = lazy(() => import('./components/Listings/ListingsPanel.tsx'));
const ShopDetailsOverlay = lazy(() => import('./components/Overlays/ShopDetailsOverlay.tsx'));
const SocialOverlay = lazy(() => import('./components/Overlays/SocialOverlay.tsx'));

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Domain-specific hooks
  const { allLocations, setCurrentlyDisplayedLocations } = useLocationData();
  const { lastPlaceSelectedByAutocomplete, currentRadius, mapsApiReady, setLastPlaceSelectedByAutocompleteAndCookie, setMapViewTargetLocation } = useSearch();
  const { activeProductFilters, activeLocationTypes } = useFilters();
  const { selectedShop, isShopOverlayOpen, isSocialOverlayOpen, openShopOverlays, closeShopOverlays, setSelectedShop } = useUI();

  // Sync filter/search state to URL parameters (with debouncing)
  useURLSync();

  // Use custom hook for filtering and sorting shops
  const filteredAndSortedShops = useFilteredShops({
    allFarmStands: allLocations,
    activeProductFilters,
    activeLocationTypes,
    searchLocation: lastPlaceSelectedByAutocomplete,
    currentRadius,
    mapsApiReady,
  });

  // Update displayed shops when filtered results change
  // Optimized: Remove setCurrentlyDisplayedLocations from deps to prevent unnecessary re-renders
  // The setter function is stable and doesn't need to be in the dependency array
  useEffect(() => {
    setCurrentlyDisplayedLocations(filteredAndSortedShops);
  }, [filteredAndSortedShops]);

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
          openShopOverlays(shopFromUrl);
        } else if (!isShopOverlayOpen && !isSocialOverlayOpen) {
          openShopOverlays(selectedShop);
        }
      } else {
        // Shop not found - redirect to homepage
        navigate('/', { replace: true });
        if (isShopOverlayOpen || isSocialOverlayOpen) closeShopOverlays();
        if (selectedShop) setSelectedShop(null);
      }
    } else if (location.pathname === '/' || isTypeFilterPage(location.pathname)) {
      // On homepage or type filter page - close any open overlays
      if (selectedShop || isShopOverlayOpen || isSocialOverlayOpen) {
        if (isShopOverlayOpen || isSocialOverlayOpen) closeShopOverlays();
        if (selectedShop) setSelectedShop(null);
      }
    } else if (!selectedShop && location.pathname.match(/^\/(farm-stand|cheesemonger|fishmonger|butcher|antique-shop|brewery|winery|sugar-shack)\//)) {
      // Edge case: shop detail URL but no selected shop and data is loaded
      if (allLocations && allLocations.length > 0) {
        navigate('/', { replace: true });
        if (isShopOverlayOpen || isSocialOverlayOpen) closeShopOverlays();
      }
    }
  }, [
      location.pathname, allLocations, filteredAndSortedShops, selectedShop, isShopOverlayOpen, isSocialOverlayOpen,
      openShopOverlays, closeShopOverlays, setSelectedShop, navigate
    ]
  );

  // Keyboard listener for Escape key
  // Escape key handler to close overlays
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (isShopOverlayOpen || isSocialOverlayOpen)) {
        closeShopOverlays();
        setSelectedShop(null); // Also deselect shop
        navigate('/');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isShopOverlayOpen, isSocialOverlayOpen, closeShopOverlays, navigate, setSelectedShop]);

  // SEO: Update meta tags and structured data based on current route
  useEffect(() => {
    const slugMatch = location.pathname.match(/^\/farm\/(.+)/);

    if (slugMatch && selectedShop) {
      // Farm detail page - use shop-specific SEO
      const seoConfig = getFarmStandSEO(selectedShop);
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
            <div className="flex-1">
              {mapsApiReady ? <MapComponent /> : <div className="w-full h-full flex items-center justify-center bg-gray-200 text-lg">Loading Map API...</div>}
            </div>
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={<div className="w-full md:w-2/5 lg:w-1/3 p-4 bg-white/80 animate-pulse z-10" />}>
            <ListingsPanel />
          </Suspense>
        </ErrorBoundary>

        {isShopOverlayOpen && selectedShop && (
          <LazyLoadErrorBoundary componentName="shop details">
            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
              <ShopDetailsOverlay
                shop={selectedShop}
                onClose={() => {
                  closeShopOverlays();
                  setSelectedShop(null);
                  navigate('/');
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {isSocialOverlayOpen && selectedShop && (
          <LazyLoadErrorBoundary componentName="social media">
            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
              <SocialOverlay
                shop={selectedShop}
                onClose={() => {
                  closeShopOverlays();
                  setSelectedShop(null);
                  navigate('/');
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
      </main>
      <Routes>
          {/* Homepage redirect to /all */}
          <Route path="/" element={<Navigate to="/all" replace />} />

          {/* Type filter pages - MUST come before detail pages to avoid conflicts */}
          <Route path="/all" element={<React.Fragment />} />
          <Route path="/farms" element={<React.Fragment />} />
          <Route path="/cheese" element={<React.Fragment />} />
          <Route path="/fish" element={<React.Fragment />} />
          <Route path="/butchers" element={<React.Fragment />} />
          <Route path="/antiques" element={<React.Fragment />} />
          <Route path="/breweries" element={<React.Fragment />} />
          <Route path="/wineries" element={<React.Fragment />} />
          <Route path="/sugar-shacks" element={<React.Fragment />} />

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