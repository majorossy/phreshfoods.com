// src/App.tsx
import React, { useContext, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from './contexts/AppContext.tsx';
import { Shop } from './types'; // Assuming your Shop type is here

import Header from './components/Header/Header.tsx';
import MapComponent from './components/Map/MapComponent.tsx';
import ListingsPanel from './components/Listings/ListingsPanel.tsx';
import ShopDetailsOverlay from './components/Overlays/ShopDetailsOverlay.tsx';
import SocialOverlay from './components/Overlays/SocialOverlay.tsx';
import InitialSearchModal from './components/Overlays/InitialSearchModal.tsx';

function App() {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

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
    setIsInitialModalOpen,
    currentRadius,
    mapsApiReady,
  } = appContext || {};

  // Unified Search/Filter Logic
  useEffect(() => {
    console.log("-------------------- FILTERING EFFECT START --------------------");

    if (!setCurrentlyDisplayedShops) {
      console.log("[App.tsx] Effect: setCurrentlyDisplayedShops is not available. Skipping filter.");
      console.log("-------------------- FILTERING EFFECT END (skipped) --------------------");
      return;
    }
    if (!allFarmStands) {
      console.log("[App.tsx] Effect: allFarmStands is not yet available. Setting displayed to empty.");
      setCurrentlyDisplayedShops([]);
      console.log("-------------------- FILTERING EFFECT END (no stands data) --------------------");
      return;
    }

    console.log(
      "[App.tsx] Effect: Initial state for this run -> AllFarmStands:", allFarmStands.length,
      "ActiveProducts:", JSON.stringify(activeProductFilters),
      "Location:", lastPlaceSelectedByAutocomplete?.formatted_address,
      "Radius:", currentRadius
    );

    if (allFarmStands.length === 0) {
      console.log("[App.tsx] Effect: No farm stands loaded in allFarmStands array. Setting displayed to empty.");
      setCurrentlyDisplayedShops([]);
      console.log("-------------------- FILTERING EFFECT END (allFarmStands empty) --------------------");
      return;
    }

    // --- DEBUGGING THE FIRST SHOP TO VERIFY PRODUCT PROPERTY NAMES AND VALUES ---
    const firstShopForDebug = allFarmStands[0];
    if (firstShopForDebug) {
        console.log("********************************************************************************");
        console.log("[App.tsx] DEBUGGING SHOP PRODUCTS (Direct Properties):");
        console.log("  First Shop Name:", firstShopForDebug.Name || "N/A");
        // Log a few known product keys to see their values for the first shop
        console.log("  First shop 'corn' value:", firstShopForDebug.corn);
        console.log("  First shop 'beef' value:", firstShopForDebug.beef);
        // console.log("  Full first shop object for inspection:", JSON.stringify(firstShopForDebug)); // Uncomment if needed
        console.log("********************************************************************************");
    }
    // --- END DEBUGGING ---

    let filteredStands = [...allFarmStands];

    // 1. Apply Product Filters
    const currentActiveProductFilters = activeProductFilters || {};
    const activeFilterKeys = Object.keys(currentActiveProductFilters).filter(key => currentActiveProductFilters[key]);
    
    if (activeFilterKeys.length > 0) {
      console.log("[App.tsx] Effect: Active product filter keys:", activeFilterKeys);
      filteredStands = filteredStands.filter((shop: Shop) => { // Added type Shop here
        return activeFilterKeys.every(filterKey => {
          // Accessing direct boolean properties on the shop object.
          // The filterKey (e.g., "corn") must exactly match the property name in your JSON.
          // (shop as any)[filterKey] is used to bypass strict TypeScript key checking if Shop type isn't exhaustive for products.
          // A better approach is to ensure your Shop type includes all possible product keys as optional booleans.
          const productIsAvailable = !!(shop as any)[filterKey];
          // Or, if your Shop type is correctly defined with all product keys:
          // const productIsAvailable = !!shop[filterKey as keyof Shop];


          // --- DETAILED DEBUG LOG FOR A SPECIFIC FILTER ---
          // if (filterKey === 'corn') { // Replace 'corn' with any filter you are actively testing
          //    console.log(`    [Product Check] Shop: ${shop.Name}, Filter: ${filterKey}, Shop's Value for '${filterKey}': ${shop[filterKey as keyof Shop]}, Evaluated: ${productIsAvailable}`);
          // }
          // --- END DETAILED DEBUG LOG ---
          return productIsAvailable;
        });
      });
      console.log("[App.tsx] Effect: After product filters, count:", filteredStands.length);
    } else {
      // console.log("[App.tsx] Effect: No active product filters.");
    }

    // 2. Apply Location/Radius Filter
    if (mapsApiReady && window.google?.maps?.geometry?.spherical && lastPlaceSelectedByAutocomplete?.geometry?.location && currentRadius > 0) {
      const placeLocation = lastPlaceSelectedByAutocomplete.geometry.location;
      let searchCenterLat: number | undefined;
      let searchCenterLng: number | undefined;

      if (placeLocation && typeof placeLocation.lat === 'function' && typeof placeLocation.lng === 'function') {
        // It's a google.maps.LatLng object
        searchCenterLat = placeLocation.lat();
        searchCenterLng = placeLocation.lng();
      } else if (placeLocation && typeof placeLocation.lat === 'number' && typeof placeLocation.lng === 'number') {
        // It's a LatLngLiteral (plain object)
        searchCenterLat = placeLocation.lat;
        searchCenterLng = placeLocation.lng;
      } else {
        console.warn("[App.tsx] Effect: lastPlaceSelectedByAutocomplete.geometry.location is in an unexpected format or undefined.", placeLocation);
      }

      if (searchCenterLat !== undefined && searchCenterLng !== undefined) {
        console.log("[App.tsx] Effect: Applying location filter. Center:", lastPlaceSelectedByAutocomplete.formatted_address, "Radius:", currentRadius, "mi");
        const searchCenter = { lat: searchCenterLat, lng: searchCenterLng };
        const radiusInMeters = currentRadius * 1609.34;

        filteredStands = filteredStands.filter(shop => {
          if (shop.lat == null || shop.lng == null || isNaN(shop.lat) || isNaN(shop.lng)) return false;
          const shopLocation = { lat: shop.lat, lng: shop.lng };
          try {
            const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
              new window.google.maps.LatLng(searchCenter),
              new window.google.maps.LatLng(shopLocation)
            );
            return distance <= radiusInMeters;
          } catch (e) {
            console.error("[App.tsx] Effect: Error computing distance:", e);
            return false;
          }
        });
        console.log("[App.tsx] Effect: After location filter, count:", filteredStands.length);
      }
    } else if (lastPlaceSelectedByAutocomplete?.geometry?.location && currentRadius > 0) {
      // console.warn("[App.tsx] Effect: Location filter conditions not fully met. mapsApiReady:", mapsApiReady, "Geometry Lib Loaded:", !!window.google?.maps?.geometry?.spherical);
    }

    console.log("[App.tsx] Effect: END Filtering. Final displayedShops count:", filteredStands.length);
    setCurrentlyDisplayedShops(filteredStands);
    console.log("-------------------- FILTERING EFFECT END --------------------");

  }, [
      allFarmStands,
      activeProductFilters,
      lastPlaceSelectedByAutocomplete,
      currentRadius,
      setCurrentlyDisplayedShops,
      mapsApiReady
    ]
  );

  // Handle direct navigation to /farm/:slug or overlay closure
  useEffect(() => {
    if (!allFarmStands || !openShopOverlays || !closeShopOverlays) {
      return;
    }
    const slugMatch = location.pathname.match(/^\/farm\/(.+)/);
    if (slugMatch && slugMatch[1] && allFarmStands.length > 0) {
      const slug = slugMatch[1];
      const shopFromSlug = allFarmStands.find(s => s.slug === slug);
      if (shopFromSlug) {
        if (!selectedShop || selectedShop.slug !== slug) {
          openShopOverlays(shopFromSlug);
        }
      } else {
        console.warn(`[App.tsx] Nav: Farm stand with slug '${slug}' not found. Redirecting to home.`);
        navigate('/', { replace: true });
        closeShopOverlays();
      }
    } else if (location.pathname === '/' && (isShopOverlayOpen || isSocialOverlayOpen)) {
      closeShopOverlays();
    }
  }, [location.pathname, allFarmStands, selectedShop, openShopOverlays, closeShopOverlays, navigate, isShopOverlayOpen, isSocialOverlayOpen]);

  // Keyboard listener for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isInitialModalOpen && setIsInitialModalOpen) {
           setIsInitialModalOpen(false);
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
    return <div className="flex items-center justify-center h-screen text-xl">Loading application context...</div>;
  }

  return (
    <div id="app-container" className="h-screen flex flex-col">
      <Header />
      <main className="flex-grow relative overflow-hidden">
        <div className="w-full h-full">
          {mapsApiReady ? <MapComponent /> : <div className="w-full h-full flex items-center justify-center bg-gray-200 text-lg">Loading Map API...</div>}
        </div>
        <ListingsPanel />
        
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
          <Route path="/" element={<React.Fragment />} />
          <Route path="/farm/:slug" element={<React.Fragment />} />
      </Routes>
    </div>
  );
}

export default App;