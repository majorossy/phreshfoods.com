// src/App.tsx
import React, { useContext, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from './contexts/AppContext.tsx'; // Ensure this path is correct

import Header from './components/Header/Header.tsx';
import MapComponent from './components/Map/MapComponent.tsx';
import ListingsPanel from './components/Listings/ListingsPanel.tsx';
import ProductFilters from './components/Filters/ProductFilters.tsx';
import ShopDetailsOverlay from './components/Overlays/ShopDetailsOverlay.tsx';
import SocialOverlay from './components/Overlays/SocialOverlay.tsx';
import InitialSearchModal from './components/Overlays/InitialSearchModal.tsx';

// import { PRODUCT_ICONS_CONFIG } from './config/appConfig'; // Keep if used in App.tsx directly

function App() {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Destructure only what's needed from context if AppContext can be undefined initially
  const {
    allFarmStands,
    setCurrentlyDisplayedShops,
    activeProductFilters,
    lastPlaceSelectedByAutocomplete,
    selectedShop,
    isShopOverlayOpen,
    isSocialOverlayOpen,
    openShopOverlays,
    closeShopOverlays,
    isInitialModalOpen,
    setIsInitialModalOpen, // Assuming you'll add this to context
    currentRadius,
    mapsApiReady, // Added from context
  } = appContext || {}; // Provide a fallback if context can be undefined

  // Unified Search/Filter Logic (simplified for now)
  useEffect(() => {
    if (!allFarmStands || !setCurrentlyDisplayedShops) return; // Allow empty allFarmStands initially
    if (allFarmStands.length === 0) { // If no stands fetched yet, display nothing
      setCurrentlyDisplayedShops([]);
      return;
    }


     console.log("[App.tsx] Filtering effect. AllFarmStands:", allFarmStands.length, "ActiveFilters:", activeProductFilters);

     let filteredStands = [...allFarmStands];

     // 1. Apply Product Filters
    const activeFilterKeys = Object.keys(activeProductFilters).filter(key => activeProductFilters[key]);
    if (activeFilterKeys.length > 0) {
      filteredStands = filteredStands.filter(shop => {
        // Check if the shop has ALL selected products
        // This assumes shop.products is an object like { beef: true, corn: false }
        // or shop.productsAvailable from your sheet data might be structured differently.
        // Adjust this logic to match your Shop data structure for products.
        if (!shop.products) return false; // Or shop.productsAvailable

        return activeFilterKeys.every(filterKey => {
          // Example: if shop.products is { beef: true, ... }
          // and filterKey is 'beef', then shop.products['beef'] should be true.
          // Adjust to your data: e.g., shop.products[filterKey] === true
          // or if shop.products is an array of strings: shop.products.includes(filterKey)
          return !!shop.products[filterKey]; // Ensure this matches how products are stored
        });
      });
      console.log("[App.tsx] After product filters:", filteredStands.length);
    }


    console.log("[App.tsx] Running search/filter effect. AllFarmStands count:", allFarmStands.length);
    // Basic: display all stands for now. You'll add filtering later.
    setCurrentlyDisplayedShops(allFarmStands);

  }, [allFarmStands, activeProductFilters, lastPlaceSelectedByAutocomplete, currentRadius, setCurrentlyDisplayedShops]);


  // Handle direct navigation to /farm/:slug or overlay closure
  useEffect(() => {
    if (!allFarmStands || allFarmStands.length === 0 || !openShopOverlays || !closeShopOverlays || !selectedShop) {
      // Don't run if context functions or necessary data isn't ready
      // or if selectedShop logic is not what we are testing now
    }

    const slugMatch = location.pathname.match(/^\/farm\/(.+)/);
    if (slugMatch && slugMatch[1] && allFarmStands && allFarmStands.length > 0) {
      const slug = slugMatch[1];
      const shopFromSlug = allFarmStands.find(s => s.slug === slug);
      if (shopFromSlug && (!selectedShop || selectedShop.slug !== slug)) {
        openShopOverlays?.(shopFromSlug); // Use optional chaining
      } else if (!shopFromSlug) {
        navigate('/', { replace: true });
        closeShopOverlays?.();
      }
    } else if (location.pathname === '/' && (isShopOverlayOpen || isSocialOverlayOpen)) {
      closeShopOverlays?.();
    }
  }, [location.pathname, allFarmStands, selectedShop, openShopOverlays, closeShopOverlays, navigate, isShopOverlayOpen, isSocialOverlayOpen]);


  // Keyboard listener for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isInitialModalOpen && setIsInitialModalOpen) {
           setIsInitialModalOpen(false); // Example: just close it
        } else if ((isShopOverlayOpen || isSocialOverlayOpen) && closeShopOverlays) {
          closeShopOverlays();
          navigate('/');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isInitialModalOpen, setIsInitialModalOpen, isShopOverlayOpen, isSocialOverlayOpen, closeShopOverlays, navigate]);

  if (!appContext) {
    return <div>Loading application context...</div>; // Or some other loading indicator
  }


return (
  <div id="app-container" className="h-screen flex flex-col">
    <Header />
    <main className="flex-grow relative overflow-hidden"> {/* Ensure main can contain absolutely positioned children properly */}
      {/* Map Component - This should fill the main area */}
      <div className="w-full h-full"> {/* Wrapper for the map to ensure it takes full space */}
        {mapsApiReady ? <MapComponent /> : <div className="w-full h-full flex items-center justify-center bg-gray-200">Loading Map API...</div>}
      </div>

      {/* Listings Panel - This will overlay the map */}
      <ListingsPanel />

      {/* Other Overlays - These will also overlay the map and potentially ListingsPanel */}
      {isShopOverlayOpen && selectedShop && (
        <ShopDetailsOverlay
          shop={selectedShop}
          onClose={() => {
            closeShopOverlays?.();
            navigate('/');
          }}
        />
      )}
      {isSocialOverlayOpen && selectedShop && (
        <SocialOverlay
          shop={selectedShop}
          onClose={() => { closeShopOverlays?.(); navigate('/'); }}
        />
      )}
    </main>
    {isInitialModalOpen && <InitialSearchModal />}
    <Routes>
        <Route path="/" element={<></>} />
        <Route path="/farm/:slug" element={<></>} />
    </Routes>
  </div>
);
}

export default App;