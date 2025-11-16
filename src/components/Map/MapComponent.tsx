// src/components/Map/MapComponent.tsx
import React, { useEffect, useRef, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { AppContext, AutocompletePlace } from '../../contexts/AppContext.tsx';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAINE_BOUNDS_LITERAL,
  MAP_ID,
  USER_LOCATION_MAP_ZOOM,
  markerColor,
  mapStyles, // For custom map styling
  USE_CUSTOM_MAP_STYLE // Flag to enable/disable custom styles
} from '../../config/appConfig.ts';
import { Shop } from '../../types';
import { useNavigate } from 'react-router-dom';
import InfoWindowContent from './InfoWindowContent.tsx';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const googleInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const infoWindowReactRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const appContext = useContext(AppContext);
  const navigate = useNavigate();

  if (!appContext) {
    return <div id="map" ref={mapRef} className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">Loading map context...</div>;
  }

  const {
    mapsApiReady,
    currentlyDisplayedShops,
    mapViewTargetLocation,
    selectedShop,
    openShopOverlays,
    closeShopOverlays,
    setSelectedShop,
    directionsResult,
    clearDirections,
    isShopOverlayOpen,
    isSocialOverlayOpen,
  } = appContext;

  const closeNativeInfoWindow = useCallback(() => {
    if (googleInfoWindowRef.current?.getMap()) {
      googleInfoWindowRef.current.close();
    }
  }, []);

  const unmountInfoWindowReactRoot = useCallback(() => {
    const rootToUnmount = infoWindowReactRootRef.current;
    if (rootToUnmount) {
      setTimeout(() => { rootToUnmount.unmount(); }, 0);
      infoWindowReactRootRef.current = null;
    }
  }, []);

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
      styles: USE_CUSTOM_MAP_STYLE ? mapStyles.maineLicensePlate : undefined,
    });
    googleMapRef.current = mapInstance;

    googleInfoWindowRef.current = new window.google.maps.InfoWindow({
      pixelOffset: new window.google.maps.Size(0, -10),
      disableAutoPan: false,
    });

    // --- ADDED: Initialize DirectionsRenderer ---
    if (window.google?.maps?.DirectionsRenderer) {
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            // Optional: You can provide options for the renderer here
            // suppressMarkers: true, // If you want to use your own markers for origin/destination
            // preserveViewport: false, // Allow renderer to adjust viewport to fit route
        });
        directionsRendererRef.current.setMap(mapInstance);
    } else {
        console.error("[MapComponent] google.maps.DirectionsRenderer not available.");
    }
    // --- END ADDED ---

    const mapClickListener = mapInstance.addListener("click", (e: google.maps.MapMouseEvent | google.maps.IconMouseEvent) => {
      if ((e as google.maps.IconMouseEvent).placeId) {
        console.log("MapComponent: Clicked on Google POI, ignoring");
        return;
      } // Clicked on a Google POI

      console.log("MapComponent: Map base clicked - navigating to /");
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();

      // Navigate to home - this will trigger App.tsx to close overlays and clear selected shop
      navigate('/', { replace: true });

      if (directionsResult && clearDirections) {
        console.log("MapComponent: Clearing directions due to map click.");
        clearDirections();
      }
    });

    // console.log("MapComponent: Google Map Initialized."); // Optional debug
    return () => {
      if (mapClickListener) mapClickListener.remove();
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();
    };
  }, [mapsApiReady, navigate, closeNativeInfoWindow, unmountInfoWindowReactRoot, directionsResult, clearDirections]);


  // Plot/Update Markers
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !window.google?.maps?.marker || !currentlyDisplayedShops) {
      return;
    }
    const newMarkersMap = new Map<string, google.maps.marker.AdvancedMarkerElement>();

    currentlyDisplayedShops.forEach((shop: Shop, index) => {
      if (shop.lat == null || shop.lng == null || isNaN(shop.lat) || isNaN(shop.lng)) return;
      const shopId = shop.slug || shop.GoogleProfileID || String(shop.id) || `marker-${index}`;
      if (!shopId) return;

      let marker = markersRef.current.get(shopId);
      if (!marker) {
        const markerElement = document.createElement('div');
        markerElement.style.width = '20px';
        markerElement.style.height = '20px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.border = '2px solid white';
        markerElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
        markerElement.style.cursor = 'pointer';
        markerElement.style.transition = 'transform 0.15s ease-out, background-color 0.15s ease-out';
        
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: shop.lat, lng: shop.lng },
          map: map,
          title: shop.Name,
          content: markerElement,
        });

        marker.addListener('gmp-click', (event: MouseEvent) => {
          event.domEvent?.stopPropagation();
          // console.log(`MapComponent: Marker clicked for ${shop.Name}`); // Optional debug
          if (setSelectedShop) setSelectedShop(shop);
          if (openShopOverlays) openShopOverlays(shop, 'shop'); // Default to 'shop' tab
          if (shop.slug) navigate(`/farm/${shop.slug}`, { replace: true });
          
          // Close small InfoWindow if main overlay is opening
          closeNativeInfoWindow();
          unmountInfoWindowReactRoot();
        });
      } else {
        marker.map = map;
      }
      
      const isSelected = selectedShop?.slug === shop.slug;
      (marker.content as HTMLElement).style.transform = isSelected ? 'scale(1.5)' : 'scale(1.2)';
      (marker.content as HTMLElement).style.backgroundColor = isSelected ? 'darkred' : markerColor;
      marker.zIndex = isSelected ? 1001 : index + 1;

      newMarkersMap.set(shopId, marker);
    });

    markersRef.current.forEach((oldMarker, shopId) => {
      if (!newMarkersMap.has(shopId)) {
        oldMarker.map = null;
      }
    });
    markersRef.current = newMarkersMap;
  }, [currentlyDisplayedShops, mapsApiReady, selectedShop, navigate, setSelectedShop, openShopOverlays, markerColor, closeNativeInfoWindow, unmountInfoWindowReactRoot]);

  // Effect to pan map to selectedShop
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !selectedShop) return;
    if (selectedShop.lat != null && selectedShop.lng != null && !isNaN(selectedShop.lat) && !isNaN(selectedShop.lng)) {
      const shopLatLng = new window.google.maps.LatLng(selectedShop.lat, selectedShop.lng);
      map.panTo(shopLatLng);
      // if(map.getZoom() && map.getZoom() < 13) map.setZoom(13); // Optional zoom
    }
  }, [selectedShop, mapsApiReady]);

  // Effect to pan map to mapViewTargetLocation (from Autocomplete or initial cookie load)
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !mapViewTargetLocation?.geometry?.location) return;

    const location = mapViewTargetLocation.geometry.location;
    let targetLatLng: google.maps.LatLng;

    if (typeof (location as google.maps.LatLng).lat === 'function') {
      targetLatLng = location as google.maps.LatLng;
    } else if (typeof (location as google.maps.LatLngLiteral).lat === 'number') {
      targetLatLng = new window.google.maps.LatLng(
        (location as google.maps.LatLngLiteral).lat,
        (location as google.maps.LatLngLiteral).lng
      );
    } else { return; }
    
    map.panTo(targetLatLng);
    const viewport = mapViewTargetLocation.geometry.viewport;
    if (viewport) {
        map.fitBounds(viewport);
    } else {
        map.setZoom(USER_LOCATION_MAP_ZOOM);
    }
  }, [mapViewTargetLocation, mapsApiReady]);


  // --- ADDED: Effect to display/clear directions route on map ---
  useEffect(() => {
    if (mapsApiReady && directionsRendererRef.current) {
      if (directionsResult) {
        // console.log("[MapComponent] Rendering directions on map."); // Optional debug
        directionsRendererRef.current.setDirections(directionsResult);
      } else {
        // console.log("[MapComponent] Clearing directions from map."); // Optional debug
        directionsRendererRef.current.setDirections({ routes: [] } as google.maps.DirectionsResult);
      }
    }
  }, [directionsResult, mapsApiReady]);
  // --- END ADDED ---

  // Effect to handle InfoWindow content rendering
  useEffect(() => {
    const map = googleMapRef.current;
    const googleInfoWin = googleInfoWindowRef.current;

    // Check if essential components are ready
    if (!mapsApiReady || !map || !googleInfoWin || !setSelectedShop || !openShopOverlays) {
      // If essential components not ready, ensure InfoWindow is closed
      if (googleInfoWin?.getMap()) closeNativeInfoWindow();
      if (infoWindowReactRootRef.current) unmountInfoWindowReactRoot();
      return;
    }

    if (selectedShop && selectedShop.lat != null && selectedShop.lng != null) {
      const shopId = selectedShop.slug || selectedShop.GoogleProfileID || String(selectedShop.id);
      const markerInstance = markersRef.current.get(shopId);

      if (markerInstance) {
        if (infoWindowReactRootRef.current) unmountInfoWindowReactRoot(); // Defensive unmount
        
        const contentDiv = document.createElement('div');
        const newReactRoot = ReactDOM.createRoot(contentDiv);
        infoWindowReactRootRef.current = newReactRoot;

        newReactRoot.render(
          <InfoWindowContent
            shop={selectedShop}
            onDirectionsClick={(clickedShop) => {
              // --- MODIFIED: Open SocialOverlay to 'directions' tab ---
              if (openShopOverlays) openShopOverlays(clickedShop, 'directions');
              closeNativeInfoWindow();
              unmountInfoWindowReactRoot();
              // setSelectedShop(null); // Keep shop selected for SocialOverlay
            }}
            onDetailsClick={(clickedShop) => {
              if (openShopOverlays) openShopOverlays(clickedShop, 'shop');
              closeNativeInfoWindow();
              unmountInfoWindowReactRoot();
            }}
          />
        );
        googleInfoWin.setContent(contentDiv);
        if (!googleInfoWin.getMap() || googleInfoWin.getAnchor() !== markerInstance) {
            googleInfoWin.open({ anchor: markerInstance, map });
        }
      } else {
        closeNativeInfoWindow();
      }
    } else {
      closeNativeInfoWindow();
    }
    return () => {
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();
    };
  }, [selectedShop, mapsApiReady, setSelectedShop, openShopOverlays, closeNativeInfoWindow, unmountInfoWindowReactRoot]);

  return <div id="map" ref={mapRef} className="w-full h-full bg-gray-200"></div>;
};

export default MapComponent;