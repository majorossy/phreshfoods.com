// src/components/Map/MapComponent.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { useFarmData } from '../../contexts/FarmDataContext.tsx';
import { useSearch } from '../../contexts/SearchContext.tsx';
import { useUI } from '../../contexts/UIContext.tsx';
import { useDirections } from '../../contexts/DirectionsContext.tsx';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAINE_BOUNDS_LITERAL,
  MAP_ID,
  USER_LOCATION_MAP_ZOOM,
  markerColor,
  mapStyles, // For custom map styling
  USE_CUSTOM_MAP_STYLE, // Flag to enable/disable custom styles
  METERS_PER_MILE, // For radius circle conversion
} from '../../config/appConfig.ts';
import { panToWithOffsets } from '../../utils/mapPanning';
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
  const previousSelectedShopSlugRef = useRef<string | null>(null);
  const previousHoveredShopSlugRef = useRef<string | null>(null);
  const searchLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchRadiusCircleRef = useRef<google.maps.Circle | null>(null);

  const navigate = useNavigate();

  // Use domain-specific hooks for better performance (only re-render when relevant state changes)
  const { currentlyDisplayedShops } = useFarmData();
  const { mapsApiReady, mapViewTargetLocation, currentRadius } = useSearch();
  const { selectedShop, setSelectedShop, hoveredShop, setHoveredShop, openShopOverlays, isShopOverlayOpen, isSocialOverlayOpen } = useUI();
  const { directionsResult, clearDirections } = useDirections();

  const closeNativeInfoWindow = useCallback(() => {
    if (googleInfoWindowRef.current?.getMap()) {
      googleInfoWindowRef.current.close();
    }
  }, []);

  const unmountInfoWindowReactRoot = useCallback(() => {
    const rootToUnmount = infoWindowReactRootRef.current;
    if (rootToUnmount) {
      // Defer unmount to avoid React 18 warning about synchronous unmount during render
      setTimeout(() => {
        try {
          rootToUnmount.unmount();
        } catch (error) {
          console.error('Error unmounting InfoWindow root:', error);
        }
      }, 0);
      infoWindowReactRootRef.current = null;
    }
  }, []);

  // Memoized helper for creating marker DOM elements
  const createMarkerElement = useCallback(() => {
    const markerElement = document.createElement('div');
    markerElement.style.width = '20px';
    markerElement.style.height = '20px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.border = '2px solid white';
    markerElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
    markerElement.style.cursor = 'pointer';
    markerElement.style.transition = 'transform 0.15s ease-out, background-color 0.15s ease-out';
    return markerElement;
  }, []);

  // Memoized marker click handler factory
  const createMarkerClickHandler = useCallback((shop: Shop) => {
    return (event: MouseEvent) => {
      event.domEvent?.stopPropagation();
      if (setSelectedShop) setSelectedShop(shop);
      if (openShopOverlays) openShopOverlays(shop, 'shop');
      if (shop.slug) navigate(`/farm/${shop.slug}`, { replace: true });
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();
    };
  }, [setSelectedShop, openShopOverlays, navigate, closeNativeInfoWindow, unmountInfoWindowReactRoot]);


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
      // No map restrictions - users can pan freely to see surrounding areas
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
        return;
      } // Clicked on a Google POI

      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();

      // Navigate to home - this will trigger App.tsx to close overlays and clear selected shop
      navigate('/', { replace: true });

      if (directionsResult && clearDirections) {
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
      if (searchLocationMarkerRef.current) {
        searchLocationMarkerRef.current.map = null;
        searchLocationMarkerRef.current = null;
      }
      if (searchRadiusCircleRef.current) {
        searchRadiusCircleRef.current.setMap(null);
        searchRadiusCircleRef.current = null;
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

    const selectedShopSlug = selectedShop?.slug || null;
    const selectionChanged = selectedShopSlug !== previousSelectedShopSlugRef.current;

    const hoveredShopSlug = hoveredShop?.slug || null;
    const hoverChanged = hoveredShopSlug !== previousHoveredShopSlugRef.current;

    currentlyDisplayedShops.forEach((shop: Shop, index) => {
      if (shop.lat == null || shop.lng == null || isNaN(shop.lat) || isNaN(shop.lng)) return;
      const shopId = shop.slug || shop.GoogleProfileID || String(shop.id) || `marker-${index}`;
      if (!shopId) return;

      let marker = markersRef.current.get(shopId);
      if (!marker) {
        // Create new marker using memoized helper
        const markerElement = createMarkerElement();

        // Add hover listeners to marker element
        markerElement.addEventListener('mouseenter', () => {
          if (setHoveredShop) setHoveredShop(shop);
        });
        markerElement.addEventListener('mouseleave', () => {
          if (setHoveredShop) setHoveredShop(null);
        });

        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: shop.lat, lng: shop.lng },
          map: map,
          title: shop.Name,
          content: markerElement,
        });

        // Use memoized click handler
        marker.addListener('gmp-click', createMarkerClickHandler(shop));
      } else {
        marker.map = map;
      }

      // Check if this marker is hovered or selected
      const isSelected = selectedShopSlug === shop.slug;
      const wasSelected = previousSelectedShopSlugRef.current === shop.slug;
      const isHovered = hoveredShopSlug === shop.slug;
      const wasHovered = previousHoveredShopSlugRef.current === shop.slug;

      // Determine marker styling based on state (hover takes precedence)
      let scale = 'scale(1.2)'; // Default
      let backgroundColor = markerColor; // Default red
      let zIndex = index + 1; // Default

      if (isHovered) {
        // Hover state - blue and larger
        scale = 'scale(1.6)';
        backgroundColor = '#4285F4'; // Google blue
        zIndex = 2000; // Highest priority
      } else if (isSelected) {
        // Selected state - blue and large (same as hover to keep visual consistency)
        scale = 'scale(1.5)';
        backgroundColor = '#4285F4'; // Google blue
        zIndex = 1001;
      }

      // Apply styling if state changed or this is a new marker
      const needsUpdate = selectionChanged && (isSelected || wasSelected) ||
                          hoverChanged && (isHovered || wasHovered) ||
                          !marker.zIndex;

      if (needsUpdate) {
        (marker.content as HTMLElement).style.transform = scale;
        (marker.content as HTMLElement).style.backgroundColor = backgroundColor;
        marker.zIndex = zIndex;
      }

      newMarkersMap.set(shopId, marker);
    });

    // Update previous selected and hovered shop references
    previousSelectedShopSlugRef.current = selectedShopSlug;
    previousHoveredShopSlugRef.current = hoveredShopSlug;

    markersRef.current.forEach((oldMarker, shopId) => {
      if (!newMarkersMap.has(shopId)) {
        oldMarker.map = null;
      }
    });
    markersRef.current = newMarkersMap;
  }, [currentlyDisplayedShops, mapsApiReady, selectedShop, hoveredShop, createMarkerElement, createMarkerClickHandler, markerColor]);

  // Effect to pan map to selectedShop with offset to frame info window
  // Uses single pan operation with calculated offsets for smooth movement
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !selectedShop) return;
    if (!window.google?.maps?.LatLng) return; // Ensure Maps API loaded
    if (selectedShop.lat == null || selectedShop.lng == null || isNaN(selectedShop.lat) || isNaN(selectedShop.lng)) return;

    const shopLatLng = new window.google.maps.LatLng(selectedShop.lat, selectedShop.lng);

    // Single smooth pan with all offsets calculated upfront
    panToWithOffsets({
      map,
      targetLatLng: shopLatLng,
      isShopOverlayOpen,
      isSocialOverlayOpen,
      includeInfoWindowOffset: true, // Frame info window above marker
    });
  }, [selectedShop, mapsApiReady, isShopOverlayOpen, isSocialOverlayOpen]);

  // Consolidated effect for search location: pan, marker, circle, and auto-zoom
  // Handles both initial location selection and radius changes
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !mapViewTargetLocation?.geometry?.location) return;

    // Convert location to LatLng
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

    // Batch all updates in requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      // Create or update search location marker
      if (!searchLocationMarkerRef.current && window.google?.maps?.marker) {
        // Create new marker
        const pinElement = document.createElement('div');
        pinElement.style.width = '30px';
        pinElement.style.height = '30px';
        pinElement.style.backgroundColor = '#4285F4'; // Google blue
        pinElement.style.borderRadius = '50% 50% 50% 0';
        pinElement.style.border = '3px solid white';
        pinElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
        pinElement.style.transform = 'rotate(-45deg)';
        pinElement.style.cursor = 'pointer';

        // Inner dot
        const innerDot = document.createElement('div');
        innerDot.style.width = '10px';
        innerDot.style.height = '10px';
        innerDot.style.backgroundColor = 'white';
        innerDot.style.borderRadius = '50%';
        innerDot.style.position = 'absolute';
        innerDot.style.top = '50%';
        innerDot.style.left = '50%';
        innerDot.style.transform = 'translate(-50%, -50%)';
        pinElement.appendChild(innerDot);

        const searchMarker = new window.google.maps.marker.AdvancedMarkerElement({
          position: targetLatLng,
          map: map,
          content: pinElement,
          title: mapViewTargetLocation.formatted_address || 'Searched Location',
          zIndex: 9999, // Always on top
        });

        searchLocationMarkerRef.current = searchMarker;
      } else if (searchLocationMarkerRef.current) {
        // Update existing marker position
        searchLocationMarkerRef.current.position = targetLatLng;
      }

      // Create or update radius circle (optimized to avoid unnecessary updates)
      const radiusInMeters = currentRadius * METERS_PER_MILE;

      if (!searchRadiusCircleRef.current && window.google?.maps?.Circle) {
        // Create new circle
        const radiusCircle = new window.google.maps.Circle({
          map: map,
          center: targetLatLng,
          radius: radiusInMeters,
          fillColor: '#4285F4', // Google blue
          fillOpacity: 0.1,
          strokeColor: '#4285F4',
          strokeOpacity: 0.4,
          strokeWeight: 2,
          clickable: false,
          zIndex: 1, // Behind markers but above map
        });

        searchRadiusCircleRef.current = radiusCircle;
      } else if (searchRadiusCircleRef.current) {
        // Only update if values actually changed (prevents unnecessary redraws)
        const currentCenter = searchRadiusCircleRef.current.getCenter();
        const currentRadiusValue = searchRadiusCircleRef.current.getRadius();

        if (!currentCenter || currentCenter.lat() !== targetLatLng.lat() || currentCenter.lng() !== targetLatLng.lng()) {
          searchRadiusCircleRef.current.setCenter(targetLatLng);
        }

        if (currentRadiusValue !== radiusInMeters) {
          searchRadiusCircleRef.current.setRadius(radiusInMeters);
        }
      }

      // Auto-zoom to fit radius circle with panel offset (single smooth operation)
      const circle = searchRadiusCircleRef.current;
      const bounds = circle?.getBounds();

      // Use unified panning utility for consistent behavior
      panToWithOffsets({
        map,
        targetLatLng,
        isShopOverlayOpen,
        isSocialOverlayOpen,
        includeInfoWindowOffset: false,
        bounds: bounds || undefined, // Use fitBounds if we have bounds, otherwise panTo
      });
    });
  }, [mapViewTargetLocation, currentRadius, mapsApiReady, isShopOverlayOpen, isSocialOverlayOpen]);

  // Listings panel width observer - re-pan when panel width changes
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady) return;

    const listingsPanel = document.getElementById('listingsPanel');
    if (!listingsPanel) return;

    let resizeTimeout: NodeJS.Timeout;

    // Create ResizeObserver to watch for panel width changes
    const resizeObserver = new ResizeObserver((entries) => {
      // Debounce to avoid excessive re-panning during animations
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Re-pan to current target with updated panel offset
        if (selectedShop && selectedShop.lat != null && selectedShop.lng != null) {
          const shopLatLng = new window.google.maps.LatLng(selectedShop.lat, selectedShop.lng);
          panToWithOffsets({
            map,
            targetLatLng: shopLatLng,
            isShopOverlayOpen,
            isSocialOverlayOpen,
            includeInfoWindowOffset: true,
          });
        } else if (mapViewTargetLocation?.geometry?.location) {
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

          const bounds = searchRadiusCircleRef.current?.getBounds();
          panToWithOffsets({
            map,
            targetLatLng,
            isShopOverlayOpen,
            isSocialOverlayOpen,
            includeInfoWindowOffset: false,
            bounds: bounds || undefined,
          });
        }
      }, 150);
    });

    resizeObserver.observe(listingsPanel);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [mapsApiReady, selectedShop, mapViewTargetLocation, isShopOverlayOpen, isSocialOverlayOpen]);

  // Window resize handler - recalculate offsets and re-pan to maintain proper framing
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady) return;

    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events (300ms)
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Re-pan to current target with updated offsets
        if (selectedShop && selectedShop.lat != null && selectedShop.lng != null) {
          // Shop is selected - re-pan to shop with info window offset
          const shopLatLng = new window.google.maps.LatLng(selectedShop.lat, selectedShop.lng);
          panToWithOffsets({
            map,
            targetLatLng: shopLatLng,
            isShopOverlayOpen,
            isSocialOverlayOpen,
            includeInfoWindowOffset: true,
          });
        } else if (mapViewTargetLocation?.geometry?.location) {
          // Search location is set - re-fit bounds with updated panel offset
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

          const bounds = searchRadiusCircleRef.current?.getBounds();
          panToWithOffsets({
            map,
            targetLatLng,
            isShopOverlayOpen,
            isSocialOverlayOpen,
            includeInfoWindowOffset: false,
            bounds: bounds || undefined,
          });
        }
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [mapsApiReady, selectedShop, mapViewTargetLocation, isShopOverlayOpen, isSocialOverlayOpen]);

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