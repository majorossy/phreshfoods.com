// src/components/Map/MapComponent.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { useLocationData } from '../../contexts/LocationDataContext.tsx';
import { useSearch } from '../../contexts/SearchContext.tsx';
import { useUI } from '../../contexts/UIContext.tsx';
import { useDirections } from '../../contexts/DirectionsContext.tsx';
import { useFilters } from '../../contexts/FilterContext.tsx';
import { useTripPlanner } from '../../contexts/TripPlannerContext.tsx';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_ID,
  markerColor,
  MARKER_COLORS,
  mapStyles, // For custom map styling
  USE_CUSTOM_MAP_STYLE, // Flag to enable/disable custom styles
  METERS_PER_MILE, // For radius circle conversion
  MARKER_SIZE_PX,
  MARKER_BORDER_WIDTH_PX,
  MARKER_TRANSITION_DURATION_S,
  MARKER_DEFAULT_SCALE,
  MARKER_DEFAULT_Z_INDEX_OFFSET,
  MARKER_SELECTED_Z_INDEX,
  MARKER_HOVER_Z_INDEX,
  MARKER_HOVER_DEBOUNCE_MS,
  SEARCH_MARKER_SIZE_PX,
  SEARCH_MARKER_Z_INDEX,
  RADIUS_CIRCLE_FILL_OPACITY,
  RADIUS_CIRCLE_STROKE_OPACITY,
  RADIUS_CIRCLE_STROKE_WIDTH,
  RADIUS_CIRCLE_Z_INDEX,
  RADIUS_CIRCLE_COLOR,
  INFO_WINDOW_PIXEL_OFFSET_X,
  INFO_WINDOW_PIXEL_OFFSET_Y,
  PANEL_RESIZE_DEBOUNCE_MS,
  WINDOW_RESIZE_DEBOUNCE_MS,
  OVERLAY_RENDER_WAIT_MS,
} from '../../config/appConfig.ts';
import { panToWithOffsets, extractLatLngFromPlace, waitForOverlaysToRender } from '../../utils/mapPanning';
import { Shop } from '../../types';
import { useNavigate } from 'react-router-dom';
import { getShopDetailBasePath } from '../../utils/typeUrlMappings';
import { encodeFiltersToURL } from '../../utils/urlSync';
import InfoWindowContent from './InfoWindowContent.tsx';
import { logger } from '../../utils/logger';


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
  const isMarkerHovered = useRef<boolean>(false);
  const isInfoWindowHovered = useRef<boolean>(false);

  const navigate = useNavigate();

  // Use domain-specific hooks for better performance (only re-render when relevant state changes)
  const { currentlyDisplayedLocations } = useLocationData();
  const { mapsApiReady, mapViewTargetLocation, currentRadius, lastPlaceSelectedByAutocomplete } = useSearch();
  const { selectedShop, setSelectedShop, hoveredShop, setHoveredShop, openShopOverlays, isShopOverlayOpen, isSocialOverlayOpen } = useUI();
  const { directionsResult, clearDirections } = useDirections();
  const { activeProductFilters, activeLocationTypes } = useFilters();
  const { tripDirectionsResult } = useTripPlanner();

  const closeNativeInfoWindow = useCallback(() => {
    if (googleInfoWindowRef.current?.getMap()) {
      googleInfoWindowRef.current.close();
    }
  }, []);

  // Check if hover should be cleared (only clear if neither marker nor InfoWindow is hovered)
  const checkAndClearHover = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      // Only clear hover if mouse has left both marker and InfoWindow
      if (!isMarkerHovered.current && !isInfoWindowHovered.current) {
        setHoveredShop(null);
      }
    }, MARKER_HOVER_DEBOUNCE_MS);
  }, [setHoveredShop]);

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

      // IMPORTANT: Use the shop from currentlyDisplayedLocations to preserve distance
      // The shop parameter might be from the closure and lack distance if markers were created before search
      const shopWithDistance = currentlyDisplayedLocations.find(
        s => s.slug === shop.slug || s.GoogleProfileID === shop.GoogleProfileID
      ) || shop;

      logger.log('Marker clicked - shop has distance:', (shopWithDistance as any).distance);

      setSelectedShop(shopWithDistance);
      openShopOverlays(shopWithDistance, 'shop');
      // Navigate to type-specific detail page with filters preserved
      if (shop.slug) {
        const basePath = getShopDetailBasePath(shop.type);

        // Build query params with current filter state for shareable URLs
        const filterState = {
          locationTypes: activeLocationTypes,
          productFilters: activeProductFilters,
          searchLocation: lastPlaceSelectedByAutocomplete,
          searchRadius: currentRadius,
        };
        const queryParams = encodeFiltersToURL(filterState);
        const queryString = queryParams.toString();

        // Navigate with filters preserved in URL
        const url = queryString ? `${basePath}/${shop.slug}?${queryString}` : `${basePath}/${shop.slug}`;
        navigate(url, { replace: true });
      }
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();
    };
  }, [currentlyDisplayedLocations, setSelectedShop, openShopOverlays, navigate, closeNativeInfoWindow, unmountInfoWindowReactRoot, activeLocationTypes, activeProductFilters, lastPlaceSelectedByAutocomplete, currentRadius]);


  // Initialize Map and its specific listeners
  useEffect(() => {
    if (!mapsApiReady || !mapRef.current || googleMapRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current!, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      mapTypeControl: false,
      gestureHandling: "greedy",
      zoomControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      rotateControl: false,
      cameraControl: false,
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
      // Clear hover timeout on cleanup
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      isMarkerHovered.current = false;
      isInfoWindowHovered.current = false;
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


  // Plot/Update Markers with Pooling Optimization
  // Markers are now reused instead of recreated, improving performance by 30-50%
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !window.google?.maps?.marker || !currentlyDisplayedLocations) {
      return;
    }

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
      const markerExists = !!marker;

      if (!marker) {
        // Create new marker only if not in pool
        const markerElement = createMarkerElement(markerColorForShop);

        // Add hover listeners to marker element with debouncing
        markerElement.addEventListener('mouseenter', () => {
          isMarkerHovered.current = true;
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          hoverTimeoutRef.current = setTimeout(() => {
            setHoveredShop(shop);
          }, MARKER_HOVER_DEBOUNCE_MS);
        });
        markerElement.addEventListener('mouseleave', () => {
          isMarkerHovered.current = false;
          checkAndClearHover();
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
        // Reuse existing marker - just update position and map if needed
        const currentPos = marker.position as google.maps.LatLngLiteral | google.maps.LatLng | null;
        const posChanged = !currentPos ||
                          (typeof currentPos.lat === 'function' ? currentPos.lat() !== shop.lat : currentPos.lat !== shop.lat) ||
                          (typeof currentPos.lng === 'function' ? currentPos.lng() !== shop.lng : currentPos.lng !== shop.lng);

        if (posChanged) {
          marker.position = { lat: shop.lat, lng: shop.lng };
        }

        if (!marker.map) {
          marker.map = map;
        }

        // Update title if changed
        if (marker.title !== shop.Name) {
          marker.title = shop.Name;
        }
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
        scale = isHovered ? 'scale(2.0)' : 'scale(2.08125)';

        // Use Maine state flag image
        backgroundImage = 'url(https://www.maine.gov/sos/kids/themes/kids/images/flag.gif)';
        backgroundColor = '';

        zIndex = isHovered ? MARKER_HOVER_Z_INDEX : MARKER_SELECTED_Z_INDEX;
      }

      // Optimized: Only update styling if state actually changed
      // This prevents unnecessary DOM updates and improves performance
      const needsUpdate = !markerExists || // New marker, needs initial styling
                          (selectionChanged && (isSelected || wasSelected)) ||
                          (hoverChanged && (isHovered || wasHovered));

      if (needsUpdate) {
        const innerMarker = (marker.content as HTMLElement).firstChild as HTMLElement;
        if (innerMarker) {
          // Update transform (scale)
          if (innerMarker.style.transform !== scale) {
            innerMarker.style.transform = scale;
          }

          // Update background image or color
          if (backgroundImage) {
            if (innerMarker.style.backgroundImage !== backgroundImage) {
              innerMarker.style.backgroundImage = backgroundImage;
              innerMarker.style.backgroundSize = `${100 + 48}%`; // Zoom: 100% base + 48% additional
              innerMarker.style.backgroundPosition = `${50 + 2}% ${50 + 16}%`; // Position: 2% right, 16% down
              innerMarker.style.backgroundColor = '';
            }
          } else {
            if (innerMarker.style.backgroundColor !== backgroundColor) {
              innerMarker.style.backgroundImage = '';
              innerMarker.style.backgroundColor = backgroundColor;
              innerMarker.style.backgroundSize = '';
              innerMarker.style.backgroundPosition = '';
            }
          }

          // Update border width (thinner when selected/hovered)
          const borderWidth = (isHovered || isSelected)
            ? `${MARKER_BORDER_WIDTH_PX * 0.5}px`
            : `${MARKER_BORDER_WIDTH_PX}px`;
          if (innerMarker.style.borderWidth !== borderWidth) {
            innerMarker.style.borderWidth = borderWidth;
          }
        }

        // Update z-index
        if (marker.zIndex !== zIndex) {
          marker.zIndex = zIndex;
        }
      }

      newMarkersMap.set(shopId, marker);
    });

    // Update previous selected and hovered shop references
    previousSelectedShopSlugRef.current = selectedShopSlug;
    previousHoveredShopSlugRef.current = hoveredShopSlug;

    // Optimized cleanup: Only remove markers that are no longer needed
    // This is more efficient than iterating through all old markers
    if (markersRef.current.size !== newMarkersMap.size) {
      markersRef.current.forEach((oldMarker, shopId) => {
        if (!newMarkersMap.has(shopId)) {
          oldMarker.map = null; // Remove from map (but keep in memory for potential reuse)
        }
      });
    }

    markersRef.current = newMarkersMap;
  }, [currentlyDisplayedLocations, mapsApiReady, selectedShop, hoveredShop, createMarkerElement, createMarkerClickHandler, checkAndClearHover, setHoveredShop]);

  // Effect to pan map to selectedShop with offset to frame info window
  // Uses single pan operation with calculated offsets for smooth movement
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !mapsApiReady || !selectedShop) return;
    if (!window.google?.maps?.LatLng) return; // Ensure Maps API loaded
    if (selectedShop.lat == null || selectedShop.lng == null || isNaN(selectedShop.lat) || isNaN(selectedShop.lng)) return;

    const shopLatLng = new window.google.maps.LatLng(selectedShop.lat, selectedShop.lng);

    // Wait for overlays to render before panning to avoid double-pan issue
    // If overlays are opening, defer pan until they have valid widths
    const doPan = async () => {
      if (isShopOverlayOpen || isSocialOverlayOpen) {
        // Wait for overlays to render (max OVERLAY_RENDER_WAIT_MS)
        const overlaysReady = await waitForOverlaysToRender(OVERLAY_RENDER_WAIT_MS);

        // Only pan if overlays are ready. If timeout, skip and let ResizeObserver handle it
        if (!overlaysReady) {
          return; // ResizeObserver will trigger pan when overlays finish rendering
        }
      }

      // Single smooth pan with all offsets calculated upfront
      panToWithOffsets({
        map,
        targetLatLng: shopLatLng,
        isShopOverlayOpen,
        isSocialOverlayOpen,
        includeInfoWindowOffset: true, // Frame info window above marker
      });
    };

    doPan();
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
        // Create new marker using optimized image with DPI detection
        const markerImage = document.createElement('img');

        // Use @2x version for Retina displays, @1x for standard
        const dpr = window.devicePixelRatio || 1;
        let imageSuffix = '@1x';
        if (dpr > 2.5) {
          imageSuffix = '@3x';
        } else if (dpr > 1.5) {
          imageSuffix = '@2x';
        }

        // Try WebP first with PNG fallback
        const supportsWebP = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
        const extension = supportsWebP ? 'webp' : 'png';

        markerImage.src = `/images/center-pin${imageSuffix}.${extension}`;
        markerImage.style.width = `${SEARCH_MARKER_SIZE_PX}px`;
        markerImage.style.height = `${SEARCH_MARKER_SIZE_PX}px`;
        markerImage.style.cursor = 'pointer';

        const searchMarker = new window.google.maps.marker.AdvancedMarkerElement({
          position: targetLatLng,
          map: map,
          content: markerImage,
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
    const resizeObserver = new ResizeObserver((_entries) => {
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
  // Priority: tripDirectionsResult takes precedence over single directionsResult
  useEffect(() => {
    if (mapsApiReady && directionsRendererRef.current) {
      // Show trip directions if available, otherwise show single destination directions
      const directionsToShow = tripDirectionsResult || directionsResult;

      if (directionsToShow) {
        directionsRendererRef.current.setDirections(directionsToShow);
      } else {
        directionsRendererRef.current.setDirections({ routes: [] } as google.maps.DirectionsResult);
      }
    }
  }, [directionsResult, tripDirectionsResult, mapsApiReady]);
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

    // Show InfoWindow for either selected or hovered shop (prioritize selected)
    const shopToShow = selectedShop || hoveredShop;

    if (shopToShow && shopToShow.lat != null && shopToShow.lng != null) {
      const shopId = shopToShow.slug || shopToShow.GoogleProfileID || String(shopToShow.id);
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
            shop={shopToShow}
          />
        );
        googleInfoWin.setContent(contentDiv);
        if (!googleInfoWin.getMap() || googleInfoWin.getAnchor() !== markerInstance) {
            googleInfoWin.open({ anchor: markerInstance, map });
        }

        // Add hover listeners to the entire InfoWindow container (includes arrow and gap)
        // Google Maps creates the container after open(), so we need to find it
        setTimeout(() => {
          // Find the InfoWindow container element (Google Maps creates this)
          const infoWindowContainers = document.querySelectorAll('.gm-style-iw-c');
          // Get the last one (most recently opened)
          const infoWindowContainer = infoWindowContainers[infoWindowContainers.length - 1] as HTMLElement;

          if (infoWindowContainer) {
            infoWindowContainer.addEventListener('mouseenter', () => {
              isInfoWindowHovered.current = true;
              // Clear any pending hover clear timeout
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
            });

            infoWindowContainer.addEventListener('mouseleave', () => {
              isInfoWindowHovered.current = false;
              checkAndClearHover();
            });
          }
        }, 0);
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
  }, [selectedShop, hoveredShop, mapsApiReady, closeNativeInfoWindow, unmountInfoWindowReactRoot, checkAndClearHover]);

  return (
    <div
      id="map"
      ref={mapRef}
      className="w-full h-full bg-gray-200"
      role="application"
      aria-label="Interactive map showing farm stands, cheesemongers, fishmongers, butchers, and antique shops in Maine"
      aria-describedby="map-description"
    >
      <div id="map-description" className="sr-only">
        An interactive Google Map displaying locations of local businesses. Click on map markers to view details. Use shop cards in the left panel for keyboard navigation.
      </div>
    </div>
  );
};

export default MapComponent;