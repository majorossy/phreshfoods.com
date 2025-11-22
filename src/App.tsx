// src/App.tsx
import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useFarmData } from './contexts/FarmDataContext';
import { useSearch } from './contexts/SearchContext';
import { useFilters } from './contexts/FilterContext';
import { useUI } from './contexts/UIContext';
import { useFilteredShops } from './hooks/useFilteredShops';
import { AutocompletePlace } from './types';
import {
  getHomepageSEO,
  getFarmStandSEO,
  generateLocalBusinessSchema,
  updateMetaTags,
  addStructuredData
} from './utils/seo';

import Header from './components/Header/Header.tsx';
import MapComponent from './components/Map/MapComponent.tsx';
import ListingsPanel from './components/Listings/ListingsPanel.tsx';
import LazyLoadErrorBoundary from './components/LazyLoadErrorBoundary.tsx';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.tsx';

// Code splitting: Lazy load overlay components to reduce initial bundle size
const ShopDetailsOverlay = lazy(() => import('./components/Overlays/ShopDetailsOverlay.tsx'));
const SocialOverlay = lazy(() => import('./components/Overlays/SocialOverlay.tsx'));

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Domain-specific hooks
  const { allFarmStands, setCurrentlyDisplayedShops } = useFarmData();
  const { lastPlaceSelectedByAutocomplete, currentRadius, mapsApiReady, setLastPlaceSelectedByAutocompleteAndCookie, setMapViewTargetLocation } = useSearch();
  const { activeProductFilters } = useFilters();
  const { selectedShop, isShopOverlayOpen, isSocialOverlayOpen, openShopOverlays, closeShopOverlays, setSelectedShop } = useUI();

  // Use custom hook for filtering and sorting shops
  const filteredAndSortedShops = useFilteredShops({
    allFarmStands,
    activeProductFilters,
    searchLocation: lastPlaceSelectedByAutocomplete,
    currentRadius,
    mapsApiReady,
  });

  // Update displayed shops when filtered results change
  // This effect only runs when filtered results actually change
  useEffect(() => {
    setCurrentlyDisplayedShops(filteredAndSortedShops);
  }, [filteredAndSortedShops, setCurrentlyDisplayedShops]);

  // Auto-populate search location when loading a direct farm URL
  useEffect(() => {
    const slugMatch = location.pathname.match(/^\/farm\/(.+)/);

    if (slugMatch && selectedShop && lastPlaceSelectedByAutocomplete === null && mapsApiReady) {
      // User navigated directly to a farm URL and no search location is set
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

  // Handle direct navigation to /farm/:slug, overlay closure, and map click deselection
  useEffect(() => {
    const slugMatch = location.pathname.match(/^\/farm\/(.+)/);

    if (slugMatch && slugMatch[1]) {
      const urlIdentifier = slugMatch[1];

      // Wait for farm data to load before attempting to find the shop
      if (!allFarmStands || allFarmStands.length === 0) {
        // Data is still loading, don't redirect yet
        return;
      }

      // Try to find by slug first, then by GoogleProfileID as fallback
      const shopFromUrl = allFarmStands.find(s => s.slug === urlIdentifier)
                       || allFarmStands.find(s => s.GoogleProfileID === urlIdentifier);

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
    } else if (location.pathname === '/') {
      // On homepage - close any open overlays
      if (selectedShop || isShopOverlayOpen || isSocialOverlayOpen) {
        if (isShopOverlayOpen || isSocialOverlayOpen) closeShopOverlays();
        if (selectedShop) setSelectedShop(null);
      }
    } else if (!selectedShop && location.pathname.startsWith('/farm/')) {
      // Edge case: farm URL but no selected shop and data is loaded
      if (allFarmStands && allFarmStands.length > 0) {
        navigate('/', { replace: true });
        if (isShopOverlayOpen || isSocialOverlayOpen) closeShopOverlays();
      }
    }
  }, [
      location.pathname, allFarmStands, selectedShop, isShopOverlayOpen, isSocialOverlayOpen,
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
    } else if (location.pathname === '/') {
      // Homepage - use homepage SEO
      const seoConfig = getHomepageSEO();
      updateMetaTags(seoConfig);

      // Remove farm-specific structured data on homepage
      const existing = document.querySelector('script[type="application/ld+json"]');
      if (existing) {
        existing.remove();
      }
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
        <Header />
      </ErrorBoundary>
      <main id="main-content" className="flex-grow relative overflow-hidden" role="main">
        <ErrorBoundary>
          <div className="w-full h-full">
            {mapsApiReady ? <MapComponent /> : <div className="w-full h-full flex items-center justify-center bg-gray-200 text-lg">Loading Map API...</div>}
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <ListingsPanel />
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
          <Route path="/" element={<React.Fragment />} />
          <Route path="/farm/:slug" element={<React.Fragment />} />
          <Route path="/cheese/:slug" element={<React.Fragment />} />
      </Routes>
    </div>
  );
}

export default App;