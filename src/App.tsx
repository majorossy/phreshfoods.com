// src/App.tsx
import React, { useContext, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from './contexts/AppContext.tsx';
import { Shop, ShopWithDistance } from './types'; // Ensure these types are defined

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
    setSelectedShop,
  } = appContext || {};

  // Unified Search/Filter Logic
  useEffect(() => {
    // console.log("-------------------- FILTERING EFFECT START --------------------"); // Optional: for detailed tracing

    if (!setCurrentlyDisplayedShops) {
      // console.log("[App.tsx] Effect: setCurrentlyDisplayedShops is not available. Skipping filter.");
      return;
    }
    if (!allFarmStands) {
      // console.log("[App.tsx] Effect: allFarmStands is not yet available. Setting displayed to empty.");
      setCurrentlyDisplayedShops([]);
      return;
    }

    // console.log( // Optional: for detailed tracing
    //   "[App.tsx] Effect: Initial state for this run -> AllFarmStands:", allFarmStands.length,
    //   "ActiveProducts:", JSON.stringify(activeProductFilters),
    //   "Location:", lastPlaceSelectedByAutocomplete?.formatted_address,
    //   "Radius:", currentRadius
    // );

    if (allFarmStands.length === 0) {
      setCurrentlyDisplayedShops([]);
      return;
    }

    let tempFilteredStands: Shop[] = [...allFarmStands];

    // 1. Apply Product Filters
    const currentActiveProductFilters = activeProductFilters || {};
    const activeFilterKeys = Object.keys(currentActiveProductFilters).filter(key => currentActiveProductFilters[key]);
    
    if (activeFilterKeys.length > 0) {
      // console.log("[App.tsx] Effect: Active product filter keys:", activeFilterKeys);
      tempFilteredStands = tempFilteredStands.filter((shop: Shop) => {
        return activeFilterKeys.every(filterKey => {
          const productIsAvailable = !!(shop as any)[filterKey]; // Assumes direct boolean properties
          return productIsAvailable;
        });
      });
      // console.log("[App.tsx] Effect: After product filters, count:", tempFilteredStands.length);
    }

    // 2. Apply Location/Radius Filter
    if (mapsApiReady && window.google?.maps?.geometry?.spherical && lastPlaceSelectedByAutocomplete?.geometry?.location && currentRadius > 0) {
      const placeLocation = lastPlaceSelectedByAutocomplete.geometry.location;
      let searchCenterLat: number | undefined;
      let searchCenterLng: number | undefined;

      if (placeLocation && typeof placeLocation.lat === 'function' && typeof placeLocation.lng === 'function') {
        searchCenterLat = placeLocation.lat();
        searchCenterLng = placeLocation.lng();
      } else if (placeLocation && typeof placeLocation.lat === 'number' && typeof placeLocation.lng === 'number') {
        searchCenterLat = placeLocation.lat;
        searchCenterLng = placeLocation.lng;
      }

      if (searchCenterLat !== undefined && searchCenterLng !== undefined) {
        const searchCenterLatLng = new window.google.maps.LatLng(searchCenterLat, searchCenterLng);
        const radiusInMeters = currentRadius * 1609.34;

        tempFilteredStands = tempFilteredStands.filter(shop => {
          if (shop.lat == null || shop.lng == null || isNaN(shop.lat) || isNaN(shop.lng)) return false;
          const shopLatLng = new window.google.maps.LatLng(shop.lat, shop.lng);
          try {
            const distance = window.google.maps.geometry.spherical.computeDistanceBetween(searchCenterLatLng, shopLatLng);
            return distance <= radiusInMeters;
          } catch (e) { return false; }
        });
        // console.log("[App.tsx] Effect: After location filter, count:", tempFilteredStands.length);
      }
    }

    // 3. Calculate Distances and Format for Display
    let finalStandsToDisplay: ShopWithDistance[] = [];
    if (mapsApiReady && window.google?.maps?.geometry?.spherical && lastPlaceSelectedByAutocomplete?.geometry?.location) {
      const placeLocation = lastPlaceSelectedByAutocomplete.geometry.location;
      let searchCenterLat: number | undefined;
      let searchCenterLng: number | undefined;

      if (placeLocation && typeof placeLocation.lat === 'function' && typeof placeLocation.lng === 'function') {
        searchCenterLat = placeLocation.lat();
        searchCenterLng = placeLocation.lng();
      } else if (placeLocation && typeof placeLocation.lat === 'number' && typeof placeLocation.lng === 'number') {
        searchCenterLat = placeLocation.lat;
        searchCenterLng = placeLocation.lng;
      }

      if (searchCenterLat !== undefined && searchCenterLng !== undefined) {
        const searchCenterLatLng = new window.google.maps.LatLng(searchCenterLat, searchCenterLng);
        finalStandsToDisplay = tempFilteredStands.map(shop => {
          if (shop.lat != null && shop.lng != null && !isNaN(shop.lat) && !isNaN(shop.lng)) {
            const shopLatLng = new window.google.maps.LatLng(shop.lat, shop.lng);
            try {
              const distanceInMeters = window.google.maps.geometry.spherical.computeDistanceBetween(searchCenterLatLng, shopLatLng);
              const distanceInMiles = distanceInMeters / 1609.34;
              return { ...shop, distance: distanceInMeters, distanceText: `${distanceInMiles.toFixed(1)} mi` };
            } catch (e) { return { ...shop, distanceText: undefined }; }
          }
          return { ...shop, distanceText: undefined };
        });
      } else {
        finalStandsToDisplay = tempFilteredStands.map(shop => ({ ...shop, distanceText: undefined }));
      }
    } else {
      finalStandsToDisplay = tempFilteredStands.map(shop => ({ ...shop, distanceText: undefined }));
    }
    
    if (finalStandsToDisplay.some(shop => shop.distance !== undefined)) {
      finalStandsToDisplay.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    // console.log("[App.tsx] Effect: END Filtering. Final displayedShops count:", finalStandsToDisplay.length);
    setCurrentlyDisplayedShops(finalStandsToDisplay);
    // console.log("-------------------- FILTERING EFFECT END --------------------");

  }, [
      allFarmStands, activeProductFilters, lastPlaceSelectedByAutocomplete,
      currentRadius, setCurrentlyDisplayedShops, mapsApiReady
    ]
  );

  // Handle direct navigation to /farm/:slug, overlay closure, and map click deselection
  useEffect(() => {
    // console.log("-------------------- NAV/OVERLAY EFFECT START --------------------"); // Optional debug
    // console.log("[App.tsx] Nav Effect current state: path=", location.pathname, "selectedShop=", selectedShop ? selectedShop.Name : 'null', "isShopOverlayOpen=", isShopOverlayOpen);

    if (!allFarmStands || !openShopOverlays || !closeShopOverlays || !setSelectedShop) {
      return;
    }

    const slugMatch = location.pathname.match(/^\/farm\/(.+)/);

    if (slugMatch && slugMatch[1]) {
      const slugInUrl = slugMatch[1];
      const shopFromSlug = allFarmStands.find(s => s.slug === slugInUrl);
      if (shopFromSlug) {
        if (!selectedShop || selectedShop.slug !== slugInUrl) {
          setSelectedShop(shopFromSlug); // Set selected shop first
          openShopOverlays(shopFromSlug); // Then open overlay
        } else if (!isShopOverlayOpen && !isSocialOverlayOpen) { // If URL matches but overlays somehow got closed
             openShopOverlays(selectedShop); // Re-open with the current selectedShop
        }
      } else {
        navigate('/', { replace: true });
        if (isShopOverlayOpen || isSocialOverlayOpen) closeShopOverlays();
        if (selectedShop) setSelectedShop(null);
      }
    } else if (location.pathname === '/') {
      if (selectedShop || isShopOverlayOpen || isSocialOverlayOpen) {
        if (isShopOverlayOpen || isSocialOverlayOpen) closeShopOverlays();
        if (selectedShop) setSelectedShop(null);
      }
    } else if (!selectedShop && location.pathname.startsWith('/farm/')) {
      navigate('/', { replace: true });
      if (isShopOverlayOpen || isSocialOverlayOpen) closeShopOverlays();
    }
    // console.log("-------------------- NAV/OVERLAY EFFECT END --------------------"); // Optional debug
  }, [
      location.pathname, allFarmStands, selectedShop, isShopOverlayOpen, isSocialOverlayOpen,
      openShopOverlays, closeShopOverlays, setSelectedShop, navigate
    ]
  );

  // Keyboard listener for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isInitialModalOpen && setIsInitialModalOpen) {
           setIsInitialModalOpen(false);
        } else if ((isShopOverlayOpen || isSocialOverlayOpen) && closeShopOverlays) {
          closeShopOverlays();
          if (setSelectedShop) setSelectedShop(null); // Also deselect shop
          navigate('/');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isInitialModalOpen, setIsInitialModalOpen, isShopOverlayOpen, isSocialOverlayOpen, closeShopOverlays, navigate, setSelectedShop]);

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
              if (setSelectedShop) setSelectedShop(null);
              navigate('/');
            }}
          />
        )}
        {isSocialOverlayOpen && selectedShop && (
          <SocialOverlay
            shop={selectedShop}
            onClose={() => { 
              closeShopOverlays?.(); 
              if (setSelectedShop) setSelectedShop(null);
              navigate('/'); 
            }}
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