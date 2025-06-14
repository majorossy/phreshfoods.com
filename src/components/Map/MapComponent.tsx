// src/components/Map/MapComponent.tsx
import React, { useEffect, useRef, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { AppContext } from '../../contexts/AppContext.tsx';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAINE_BOUNDS_LITERAL, MAP_ID, USER_LOCATION_MAP_ZOOM, markerColor } from '../../config/appConfig.ts';
import { Shop } from '../../types';
import { useNavigate } from 'react-router-dom';
import InfoWindowContent from './InfoWindowContent.tsx';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const googleInfoWindowRef = useRef<google.maps.InfoWindow | null>(null); // Renamed for clarity
  const infoWindowReactRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(null); // Renamed for clarity

  const appContext = useContext(AppContext);
  const navigate = useNavigate();

  if (!appContext) {
    return <div id="map" ref={mapRef} className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">Loading map context...</div>;
  }

  const {
    mapsApiReady,
    currentlyDisplayedShops,
    lastPlaceSelectedByAutocomplete,
    selectedShop,
    openShopOverlays,
    setSelectedShop,
  } = appContext;

  // Callback to ONLY close the Google Maps native InfoWindow
  const closeNativeInfoWindow = useCallback(() => {
    if (googleInfoWindowRef.current?.getMap()) { // Check if it's actually open
      googleInfoWindowRef.current.close();
      console.log("MapComponent: Native Google Maps InfoWindow closed.");
    }
  }, []); // googleInfoWindowRef is stable

  // Callback to unmount the React root for InfoWindow content (DEFERRED)
  const unmountInfoWindowReactRoot = useCallback(() => {
    const rootToUnmount = infoWindowReactRootRef.current;
    if (rootToUnmount) {
      console.log("MapComponent: Scheduling DEFERRED unmount of InfoWindow React root.");
      setTimeout(() => {
        console.log("MapComponent: Asynchronously unmounting InfoWindow React root.");
        rootToUnmount.unmount(); // THIS IS THE ACTUAL UNMOUNT
      }, 0);
      infoWindowReactRootRef.current = null; // Clear the ref synchronously
    }
  }, []); // infoWindowReactRootRef is stable

  // Initialize Map and its specific listeners
  useEffect(() => {
    if (!mapsApiReady || !mapRef.current || googleMapRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current!, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      mapTypeControl: false,
      gestureHandling: "greedy",
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      restriction: { latLngBounds: MAINE_BOUNDS_LITERAL, strictBounds: false },
      mapId: MAP_ID,
    });
    googleMapRef.current = mapInstance;

    googleInfoWindowRef.current = new window.google.maps.InfoWindow({
      pixelOffset: new window.google.maps.Size(0, -10),
      disableAutoPan: false,
    });

    // Listener for map clicks (to close InfoWindow and deselect shop)
    const mapClickListener = mapInstance.addListener("click", () => {
      console.log("MapComponent: Map clicked.");
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot(); // Also ensure React root is unmounted
      setSelectedShop(null);
    });

    console.log("MapComponent: Google Map Initialized.");

    return () => { // Cleanup for map initialization
      if (mapClickListener) mapClickListener.remove();
      // Potentially close and unmount InfoWindow if map itself is destroyed,
      // though the selectedShop effect cleanup should handle this too.
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();
    };
  }, [mapsApiReady, setSelectedShop, closeNativeInfoWindow, unmountInfoWindowReactRoot]);

  // Plot/Update Markers
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !window.google.maps.marker || !currentlyDisplayedShops) {
      return;
    }
    console.log(`MapComponent: Plotting/Updating ${currentlyDisplayedShops.length} markers.`);
    const newMarkersMap = new Map<string, google.maps.marker.AdvancedMarkerElement>();

    currentlyDisplayedShops.forEach((shop: Shop) => {
      if (shop.lat == null || shop.lng == null || isNaN(shop.lat) || isNaN(shop.lng)) {
        console.warn(`MapComponent: Invalid lat/lng for shop ${shop.Name}, skipping.`);
        return;
      }
      const shopId = shop.slug || shop.GoogleProfileID || shop.id;
      if (!shopId) {
        console.warn("Shop has no usable ID for marker key:", shop.Name);
        return;
      }
      let marker = markersRef.current.get(shopId);
      if (!marker) {
        const markerElement = document.createElement('div');
        markerElement.style.width = '18px';
        markerElement.style.height = '18px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.border = '2px solid white';
        markerElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
        markerElement.style.cursor = 'pointer';
        markerElement.style.transition = 'transform 0.1s ease-out, background-color 0.1s ease-out';
        
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: shop.lat, lng: shop.lng },
          map: map,
          title: shop.Name,
          content: markerElement,
        });

        marker.addListener('gmp-click', (event: MouseEvent) => {
          event.domEvent?.stopPropagation();
          console.log(`Marker clicked: ${shop.Name}`);
          setSelectedShop(shop); // Triggers InfoWindow effect
          if (shop.slug) {
            navigate(`/farm/${shop.slug}`, { replace: true });
          }
        });
      } else {
        marker.map = map;
      }
      const isSelected = selectedShop?.slug === shop.slug;
      (marker.content as HTMLElement).style.transform = isSelected ? 'scale(1.4)' : 'scale(1)';
      (marker.content as HTMLElement).style.backgroundColor = isSelected ? 'darkred' : markerColor;
      marker.zIndex = isSelected ? 1001 : newMarkersMap.size + 1;
      newMarkersMap.set(shopId, marker);
    });

    markersRef.current.forEach((oldMarker, shopId) => {
      if (!newMarkersMap.has(shopId)) {
        oldMarker.map = null;
      }
    });
    markersRef.current = newMarkersMap;
  }, [currentlyDisplayedShops, mapsApiReady, selectedShop, navigate, setSelectedShop, markerColor]);

  // Effect to handle OPENING/RENDERING InfoWindow content and CLEANING UP
  useEffect(() => {
    const map = googleMapRef.current;
    const googleInfoWin = googleInfoWindowRef.current;

    if (!mapsApiReady || !map || !googleInfoWin) {
      return; // Essential components not ready
    }

    // If a shop is selected and valid, create and render its InfoWindow content
    if (selectedShop && selectedShop.lat != null && selectedShop.lng != null) {
      const shopId = selectedShop.slug || selectedShop.GoogleProfileID || selectedShop.id;
      const markerInstance = markersRef.current.get(shopId);

      if (markerInstance) {
        console.log(`MapComponent: Rendering InfoWindow for ${selectedShop.Name}`);

        // Defensive unmount of any existing React root BEFORE creating a new one.
        // This is crucial if the cleanup from a previous effect run was somehow missed or delayed.
        if (infoWindowReactRootRef.current) {
          console.warn("MapComponent: Stale React root found before rendering new InfoWindow. Unmounting (deferred).");
          unmountInfoWindowReactRoot(); // This is already deferred
        }

        const contentDiv = document.createElement('div');
        // You can add Tailwind classes to contentDiv if needed for wrapper styling:
        // contentDiv.className = 'infowindow-content-wrapper p-0'; // Example
        
        const newReactRoot = ReactDOM.createRoot(contentDiv);
        infoWindowReactRootRef.current = newReactRoot; // Store the NEW root

        newReactRoot.render(
          <InfoWindowContent
            shop={selectedShop}
            onDirectionsClick={(clickedShop) => {
              const destination = clickedShop.Address || (clickedShop.lat && clickedShop.lng ? `${clickedShop.lat},${clickedShop.lng}` : '');
              if (destination) {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, '_blank');
              }
              closeNativeInfoWindow();
              unmountInfoWindowReactRoot(); // Important: Ensure React root is unmounted
              setSelectedShop(null);
            }}
            onDetailsClick={(clickedShop) => {
              openShopOverlays(clickedShop);
              closeNativeInfoWindow();
              unmountInfoWindowReactRoot(); // Important: Ensure React root is unmounted
              // selectedShop remains for the main overlay, but IW is gone
            }}
          />
        );

        googleInfoWin.setContent(contentDiv);
        if (!googleInfoWin.getMap() || googleInfoWin.getAnchor() !== markerInstance) {
            googleInfoWin.open({ anchor: markerInstance, map });
        }
      } else {
        console.warn(`MapComponent: Marker for ${selectedShop.Name} not found. Closing native InfoWindow if open.`);
        closeNativeInfoWindow();
        // No marker, so no new React root to worry about. Any old one is handled by cleanup.
      }
    } else {
      // No shop selected (or invalid shop), ensure native InfoWindow is closed.
      // The React root (if any) will be handled by the cleanup function.
      closeNativeInfoWindow();
    }

    // Cleanup function for THIS effect:
    // This runs when `selectedShop` (or other deps) changes BEFORE the effect runs again,
    // OR when MapComponent unmounts.
    return () => {
      console.log(`MapComponent: Cleanup for InfoWindow effect (shop: ${selectedShop?.Name || 'none'})`);
      // It's generally good to close the native InfoWindow here too as a final measure,
      // though primary calls are above or in event handlers.
      closeNativeInfoWindow();
      // Unmount the React root for the InfoWindow content DEFERRED
      unmountInfoWindowReactRoot();
    };
  }, [selectedShop, mapsApiReady, openShopOverlays, setSelectedShop, closeNativeInfoWindow, unmountInfoWindowReactRoot]);

  // Effect to pan/zoom map when `lastPlaceSelectedByAutocomplete` changes
  useEffect(() => {
    if (!googleMapRef.current || !mapsApiReady) return;

    if (lastPlaceSelectedByAutocomplete?.geometry?.location) {
      const place = lastPlaceSelectedByAutocomplete;
      const location = place.geometry.location as google.maps.LatLngLiteral;
      console.log("MapComponent: Updating map view for autocomplete selection:", place.formatted_address);

      if (googleMapRef.current && location) {
        const currentZoom = googleMapRef.current.getZoom();
        googleMapRef.current.panTo(location);
        if (currentZoom) {
          googleMapRef.current.setZoom(currentZoom);
        } else {
          googleMapRef.current.setZoom(USER_LOCATION_MAP_ZOOM);
        }
      }
      // When map re-centers due to search, close InfoWindow and deselect shop
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();
      setSelectedShop(null);
    }
  }, [lastPlaceSelectedByAutocomplete, mapsApiReady, setSelectedShop, closeNativeInfoWindow, unmountInfoWindowReactRoot]);

  return <div id="map" ref={mapRef} className="w-full h-full bg-gray-200"></div>;
};

export default MapComponent;