// src/components/Map/MapComponent.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { useLocationData } from '../../contexts/LocationDataContext.tsx';
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
  MARKER_COLORS,
  mapStyles, // For custom map styling
  USE_CUSTOM_MAP_STYLE, // Flag to enable/disable custom styles
  METERS_PER_MILE, // For radius circle conversion
  MARKER_SIZE_PX,
  MARKER_BORDER_WIDTH_PX,
  MARKER_TRANSITION_DURATION_S,
  MARKER_DEFAULT_SCALE,
  MARKER_HOVER_SCALE,
  MARKER_SELECTED_SCALE,
  MARKER_DEFAULT_Z_INDEX_OFFSET,
  MARKER_SELECTED_Z_INDEX,
  MARKER_HOVER_Z_INDEX,
  MARKER_HOVER_DEBOUNCE_MS,
  MARKER_HOVER_COLOR,
  SEARCH_MARKER_SIZE_PX,
  SEARCH_MARKER_BORDER_WIDTH_PX,
  SEARCH_MARKER_INNER_DOT_SIZE_PX,
  SEARCH_MARKER_Z_INDEX,
  SEARCH_MARKER_COLOR,
  RADIUS_CIRCLE_FILL_OPACITY,
  RADIUS_CIRCLE_STROKE_OPACITY,
  RADIUS_CIRCLE_STROKE_WIDTH,
  RADIUS_CIRCLE_Z_INDEX,
  RADIUS_CIRCLE_COLOR,
  INFO_WINDOW_PIXEL_OFFSET_X,
  INFO_WINDOW_PIXEL_OFFSET_Y,
  PANEL_RESIZE_DEBOUNCE_MS,
  WINDOW_RESIZE_DEBOUNCE_MS,
} from '../../config/appConfig.ts';
import { panToWithOffsets, extractLatLngFromPlace } from '../../utils/mapPanning';
import { Shop } from '../../types';
import { useNavigate } from 'react-router-dom';
import InfoWindowContent from './InfoWindowContent.tsx';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const googleInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const infoWindowReactRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(null);
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const previousSelectedShopSlugRef = useRef<string | null>(null);
  const previousHoveredShopSlugRef = useRef<string | null>(null);
  const searchLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchRadiusCircleRef = useRef<google.maps.Circle | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();

  // Use domain-specific hooks for better performance (only re-render when relevant state changes)
  const { currentlyDisplayedLocations } = useLocationData();
  const { mapsApiReady, mapViewTargetLocation, currentRadius } = useSearch();
  const { selectedShop, setSelectedShop, hoveredShop, setHoveredShop, openShopOverlays, isShopOverlayOpen, isSocialOverlayOpen } = useUI();
  const { directionsResult, clearDirections } = useDirections();

  const closeNativeInfoWindow = useCallback(() => {
    if (googleInfoWindowRef.current?.getMap()) {
      googleInfoWindowRef.current.close();
    }
  }, []);

  const unmountInfoWindowReactRoot = useCallback(() => {
    // Clear any pending unmount timeout
    if (unmountTimeoutRef.current) {
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = null;
    }

    const rootToUnmount = infoWindowReactRootRef.current;
    if (rootToUnmount) {
      // Clear ref immediately to prevent race conditions
      infoWindowReactRootRef.current = null;

      // Schedule unmount on next tick to avoid blocking
      // This ensures the current root is fully cleared before a new one is created
      unmountTimeoutRef.current = setTimeout(() => {
        try {
          rootToUnmount.unmount();
        } catch (error) {
          // Error during unmount, silently continue
          if (import.meta.env.DEV) {
            console.warn('[MapComponent] Error unmounting InfoWindow React root:', error);
          }
        }
        unmountTimeoutRef.current = null;
      }, 0);
    }
  }, []);

  // Memoized helper for creating marker DOM elements
  const createMarkerElement = useCallback((color: string = markerColor) => {
    // Determine if mobile based on screen width
    const isMobile = window.innerWidth < 768;

    // Create wrapper with touch target (larger on mobile, minimal on desktop)
    const wrapper = document.createElement('div');
    wrapper.style.width = isMobile ? '44px' : `${MARKER_SIZE_PX + 8}px`;  // 44px touch target on mobile, small padding on desktop
    wrapper.style.height = isMobile ? '44px' : `${MARKER_SIZE_PX + 8}px`;
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.cursor = 'pointer';

    // Create visible marker element
    const markerElement = document.createElement('div');
    markerElement.style.width = `${MARKER_SIZE_PX}px`;
    markerElement.style.height = `${MARKER_SIZE_PX}px`;
    markerElement.style.borderRadius = '50%';
    markerElement.style.border = `${MARKER_BORDER_WIDTH_PX}px solid white`;
    markerElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.5)';
    markerElement.style.transition = `transform ${MARKER_TRANSITION_DURATION_S} ease-out, background-color ${MARKER_TRANSITION_DURATION_S} ease-out`;
    markerElement.style.backgroundColor = color;
    markerElement.style.pointerEvents = 'none'; // Let wrapper handle events

    wrapper.appendChild(markerElement);
    return wrapper;
  }, []);

  // Memoized marker click handler factory
  const createMarkerClickHandler = useCallback((shop: Shop) => {
    return (event: MouseEvent) => {
      event.domEvent?.stopPropagation();
      setSelectedShop(shop);
      openShopOverlays(shop, 'shop');
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
      pixelOffset: new window.google.maps.Size(INFO_WINDOW_PIXEL_OFFSET_X, INFO_WINDOW_PIXEL_OFFSET_Y),
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

      if (directionsResult) {
        clearDirections();
      }
    });

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
      // Clear unmount timeout on component cleanup
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
        unmountTimeoutRef.current = null;
      }
      closeNativeInfoWindow();
      // Synchronously unmount root on cleanup to prevent leaks
      if (infoWindowReactRootRef.current) {
        try {
          infoWindowReactRootRef.current.unmount();
        } catch (error) {
          // Error during unmount, silently continue
        }
        infoWindowReactRootRef.current = null;
      }
    };
  }, [mapsApiReady, navigate, closeNativeInfoWindow, unmountInfoWindowReactRoot, directionsResult, clearDirections]);


  // Plot/Update Markers
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !window.google?.maps?.marker || !currentlyDisplayedLocations) {
      return;
    }

    console.log('MapComponent: Updating markers for', currentlyDisplayedLocations.length, 'locations');

    const newMarkersMap = new Map<string, google.maps.marker.AdvancedMarkerElement>();

    const selectedShopSlug = selectedShop?.slug || null;
    const selectionChanged = selectedShopSlug !== previousSelectedShopSlugRef.current;

    const hoveredShopSlug = hoveredShop?.slug || null;
    const hoverChanged = hoveredShopSlug !== previousHoveredShopSlugRef.current;

    currentlyDisplayedLocations.forEach((shop: Shop, index) => {
      if (shop.lat == null || shop.lng == null || isNaN(shop.lat) || isNaN(shop.lng)) return;
      const shopId = shop.slug || shop.GoogleProfileID || String(shop.id) || `marker-${index}`;
      if (!shopId) return;

      // Determine marker color based on shop type
      const markerColorForShop = MARKER_COLORS[shop.type as keyof typeof MARKER_COLORS] || MARKER_COLORS.default;

      let marker = markersRef.current.get(shopId);
      if (!marker) {
        // Create new marker using memoized helper with type-specific color
        const markerElement = createMarkerElement(markerColorForShop);

        // Add hover listeners to marker element with debouncing
        markerElement.addEventListener('mouseenter', () => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          // Small debounce to prevent rapid state changes
          hoverTimeoutRef.current = setTimeout(() => {
            setHoveredShop(shop);
          }, MARKER_HOVER_DEBOUNCE_MS);
        });
        markerElement.addEventListener('mouseleave', () => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          hoverTimeoutRef.current = setTimeout(() => {
            setHoveredShop(null);
          }, MARKER_HOVER_DEBOUNCE_MS);
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
      let scale = MARKER_DEFAULT_SCALE;
      // Type-specific colors: Use markerColorForShop determined above
      let backgroundColor = markerColorForShop;
      let backgroundImage = '';
      let zIndex = index + MARKER_DEFAULT_Z_INDEX_OFFSET;

      if (isHovered || isSelected) {
        // Hover or Selected state - use Maine state flag image with larger scale
        // Increase scale by 25% (1.6 -> 2.0 for hover, 1.5 -> 1.875 for selected)
        scale = isHovered ? 'scale(2.0)' : 'scale(1.875)';

        // Use Maine state flag image
        backgroundImage = 'url(https://www.maine.gov/sos/kids/themes/kids/images/flag.gif)';
        backgroundColor = ''; // Clear backgroundColor when using image

        zIndex = isHovered ? MARKER_HOVER_Z_INDEX : MARKER_SELECTED_Z_INDEX;
      }

      // Apply styling if state changed or this is a new marker
      const needsUpdate = selectionChanged && (isSelected || wasSelected) ||
                          hoverChanged && (isHovered || wasHovered) ||
                          !marker.zIndex;

      if (needsUpdate) {
        // Target the inner marker element (first child of wrapper)
        const innerMarker = (marker.content as HTMLElement).firstChild as HTMLElement;
        if (innerMarker) {
          innerMarker.style.transform = scale;

          if (backgroundImage) {
            innerMarker.style.backgroundImage = backgroundImage;
            innerMarker.style.backgroundSize = 'cover';
            innerMarker.style.backgroundPosition = 'center';
            innerMarker.style.backgroundColor = '';
          } else {
            innerMarker.style.backgroundImage = '';
            innerMarker.style.backgroundColor = backgroundColor;
          }
        }
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
  }, [currentlyDisplayedLocations, mapsApiReady, selectedShop, hoveredShop, createMarkerElement, createMarkerClickHandler, markerColor]);

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

    // Convert location to LatLng using utility function
    const targetLatLng = extractLatLngFromPlace(mapViewTargetLocation);
    if (!targetLatLng) return;

    // Batch all updates in requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      // Create or update search location marker
      if (!searchLocationMarkerRef.current && window.google?.maps?.marker) {
        // Create new marker
        const pinElement = document.createElement('div');
        pinElement.style.width = `${SEARCH_MARKER_SIZE_PX}px`;
        pinElement.style.height = `${SEARCH_MARKER_SIZE_PX}px`;
        pinElement.style.backgroundColor = SEARCH_MARKER_COLOR;
        pinElement.style.borderRadius = '50% 50% 50% 0';
        pinElement.style.border = `${SEARCH_MARKER_BORDER_WIDTH_PX}px solid white`;
        pinElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
        pinElement.style.transform = 'rotate(-45deg)';
        pinElement.style.cursor = 'pointer';

        // Inner dot
        const innerDot = document.createElement('div');
        innerDot.style.width = `${SEARCH_MARKER_INNER_DOT_SIZE_PX}px`;
        innerDot.style.height = `${SEARCH_MARKER_INNER_DOT_SIZE_PX}px`;
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
          zIndex: SEARCH_MARKER_Z_INDEX,
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
          fillColor: RADIUS_CIRCLE_COLOR,
          fillOpacity: RADIUS_CIRCLE_FILL_OPACITY,
          strokeColor: RADIUS_CIRCLE_COLOR,
          strokeOpacity: RADIUS_CIRCLE_STROKE_OPACITY,
          strokeWeight: RADIUS_CIRCLE_STROKE_WIDTH,
          clickable: false,
          zIndex: RADIUS_CIRCLE_Z_INDEX,
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
          const targetLatLng = extractLatLngFromPlace(mapViewTargetLocation);
          if (!targetLatLng) return;

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
      }, PANEL_RESIZE_DEBOUNCE_MS);
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
          const targetLatLng = extractLatLngFromPlace(mapViewTargetLocation);
          if (!targetLatLng) return;

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
      }, WINDOW_RESIZE_DEBOUNCE_MS);
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
        directionsRendererRef.current.setDirections(directionsResult);
      } else {
        directionsRendererRef.current.setDirections({ routes: [] } as google.maps.DirectionsResult);
      }
    }
  }, [directionsResult, mapsApiReady]);
  // --- END ADDED ---

  // Effect to handle InfoWindow content rendering
  useEffect(() => {
    const map = googleMapRef.current;
    const googleInfoWin = googleInfoWindowRef.current;

    // Check if essential components are ready (map and info window refs)
    if (!mapsApiReady || !map || !googleInfoWin) {
      // If essential components not ready, ensure InfoWindow is closed
      if (googleInfoWin?.getMap()) closeNativeInfoWindow();
      if (infoWindowReactRootRef.current) unmountInfoWindowReactRoot();
      return;
    }

    if (selectedShop && selectedShop.lat != null && selectedShop.lng != null) {
      const shopId = selectedShop.slug || selectedShop.GoogleProfileID || String(selectedShop.id);
      const markerInstance = markersRef.current.get(shopId);

      if (markerInstance) {
        // Synchronously unmount any existing root before creating a new one
        if (infoWindowReactRootRef.current) {
          const oldRoot = infoWindowReactRootRef.current;
          infoWindowReactRootRef.current = null;

          // Clear any pending cleanup timeouts
          if (unmountTimeoutRef.current) {
            clearTimeout(unmountTimeoutRef.current);
            unmountTimeoutRef.current = null;
          }

          // Immediately unmount to prevent memory leak
          try {
            oldRoot.unmount();
          } catch (error) {
            if (import.meta.env.DEV) {
              console.warn('[MapComponent] Error unmounting previous InfoWindow React root:', error);
            }
          }
        }

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
  }, [selectedShop, mapsApiReady, closeNativeInfoWindow, unmountInfoWindowReactRoot]);

  return <div id="map" ref={mapRef} className="w-full h-full bg-gray-200"></div>;
};

export default MapComponent;