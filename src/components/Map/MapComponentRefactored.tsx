// src/components/Map/MapComponentRefactored.tsx
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useLocationData } from '../../contexts/LocationDataContext.tsx';
import { useSearch } from '../../contexts/SearchContext.tsx';
import { useUI } from '../../contexts/UIContext.tsx';
import { useDirections } from '../../contexts/DirectionsContext.tsx';
import { useFilters } from '../../contexts/FilterContext.tsx';
import { useTripPlanner } from '../../contexts/TripPlannerContext.tsx';
import { useNavigate } from 'react-router-dom';
import { getShopDetailBasePath } from '../../utils/typeUrlMappings';
import { encodeFiltersToURL } from '../../utils/urlSync';
import { panToWithOffsets, extractLatLngFromPlace, waitForOverlaysToRender } from '../../utils/mapPanning';
import { Shop } from '../../types';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAINE_BOUNDS_LITERAL,
  MAP_ID,
  USER_LOCATION_MAP_ZOOM,
  mapStyles,
  USE_CUSTOM_MAP_STYLE,
  MARKER_HOVER_DEBOUNCE_MS,
  WINDOW_RESIZE_DEBOUNCE_MS,
} from '../../config/appConfig.ts';

// Import new specialized components
import { MarkerManager } from './MarkerManager';
import { InfoWindowManager } from './InfoWindowManager';
import { DirectionsRenderer } from './DirectionsRenderer';
import { SearchLocationMarker } from './SearchLocationMarker';
import { TripMarkersManager } from './TripMarkersManager';

/**
 * Refactored MapComponent that delegates responsibilities to specialized components.
 * This component is now responsible for:
 * - Initializing and managing the Google Map instance
 * - Coordinating between specialized child components
 * - Handling map view updates and panning
 * - Managing window resize events
 *
 * Responsibilities delegated to child components:
 * - MarkerManager: Shop markers and interactions
 * - InfoWindowManager: Info window display and content
 * - DirectionsRenderer: Route display
 * - SearchLocationMarker: Search location and radius
 * - TripMarkersManager: Trip planner stop markers
 */
const MapComponentRefactored: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersMapRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const [isInfoWindowHovered, setIsInfoWindowHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();

  // Use domain-specific hooks
  const { currentlyDisplayedLocations } = useLocationData();
  const { mapsApiReady, mapViewTargetLocation, currentRadius, lastPlaceSelectedByAutocomplete } = useSearch();
  const { selectedShop, setSelectedShop, hoveredShop, setHoveredShop, openShopOverlays, isShopOverlayOpen, isSocialOverlayOpen } = useUI();
  const { directionsResult } = useDirections();
  const { activeProductFilters, activeLocationTypes } = useFilters();
  const { tripStops, isTripMode, tripDirectionsResult } = useTripPlanner();

  // Initialize Google Map
  useEffect(() => {
    if (!mapsApiReady || !mapRef.current || googleMapRef.current) return;

    const mapOptions: google.maps.MapOptions = {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      mapId: USE_CUSTOM_MAP_STYLE ? undefined : MAP_ID,
      styles: USE_CUSTOM_MAP_STYLE ? mapStyles.maineLicensePlate : undefined,
      restriction: {
        latLngBounds: MAINE_BOUNDS_LITERAL,
        strictBounds: false,
      },
      gestureHandling: 'greedy',
      clickableIcons: false,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: false,
      fullscreenControl: true,
    };

    googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);

  }, [mapsApiReady]);

  // Handle marker click
  const handleMarkerClick = useCallback((shop: Shop) => {
    setSelectedShop(shop);
    openShopOverlays();

    // Update URL with shop details
    const basePath = getShopDetailBasePath(shop);
    const filterParams = encodeFiltersToURL(activeProductFilters, activeLocationTypes);
    const url = `${basePath}/${shop.slug}${filterParams ? `?${filterParams}` : ''}`;
    navigate(url, { replace: true });
  }, [setSelectedShop, openShopOverlays, activeProductFilters, activeLocationTypes, navigate]);

  // Handle marker hover with debounce
  const handleMarkerHover = useCallback((shop: Shop | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (shop) {
      setHoveredShop(shop);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        // Only clear hover if InfoWindow is not hovered
        if (!isInfoWindowHovered) {
          setHoveredShop(null);
        }
      }, MARKER_HOVER_DEBOUNCE_MS);
    }
  }, [setHoveredShop, isInfoWindowHovered]);

  // Handle InfoWindow hover state
  const handleInfoWindowHover = useCallback((isHovered: boolean) => {
    setIsInfoWindowHovered(isHovered);
    if (!isHovered) {
      // Start timer to clear hover when leaving InfoWindow
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredShop(null);
      }, MARKER_HOVER_DEBOUNCE_MS);
    }
  }, [setHoveredShop]);

  // Get marker for a shop (used by InfoWindowManager)
  const getMarkerForShop = useCallback((slug: string) => {
    return markersMapRef.current.get(slug);
  }, []);

  // Update map view when target location changes
  useEffect(() => {
    if (!googleMapRef.current || !mapViewTargetLocation) return;

    const latLng = extractLatLngFromPlace(mapViewTargetLocation);
    if (!latLng) return;

    // Handle panning based on UI state
    const handlePanning = async () => {
      if (isShopOverlayOpen || isSocialOverlayOpen) {
        await waitForOverlaysToRender();
        panToWithOffsets(googleMapRef.current!, latLng, isShopOverlayOpen, isSocialOverlayOpen);
      } else if (lastPlaceSelectedByAutocomplete) {
        googleMapRef.current.setCenter(latLng);
        googleMapRef.current.setZoom(USER_LOCATION_MAP_ZOOM);
      } else {
        googleMapRef.current.panTo(latLng);
      }
    };

    handlePanning();
  }, [mapViewTargetLocation, lastPlaceSelectedByAutocomplete, isShopOverlayOpen, isSocialOverlayOpen]);

  // Handle window resize with debounce
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (googleMapRef.current) {
          google.maps.event.trigger(googleMapRef.current, 'resize');

          // Re-pan if overlays are open
          if ((isShopOverlayOpen || isSocialOverlayOpen) && selectedShop) {
            const latLng = { lat: selectedShop.lat, lng: selectedShop.lng };
            panToWithOffsets(googleMapRef.current, latLng, isShopOverlayOpen, isSocialOverlayOpen);
          }
        }
      }, WINDOW_RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [isShopOverlayOpen, isSocialOverlayOpen, selectedShop]);

  // Calculate search location for radius display
  const searchLocation = lastPlaceSelectedByAutocomplete
    ? extractLatLngFromPlace(lastPlaceSelectedByAutocomplete)
    : null;

  return (
    <div ref={mapRef} className="w-full h-full">
      {/* Specialized components handle their own responsibilities */}

      <MarkerManager
        map={googleMapRef.current}
        shops={currentlyDisplayedLocations}
        selectedShop={selectedShop}
        hoveredShop={hoveredShop}
        onMarkerClick={handleMarkerClick}
        onMarkerHover={handleMarkerHover}
      />

      <InfoWindowManager
        map={googleMapRef.current}
        hoveredShop={hoveredShop}
        onInfoWindowHover={handleInfoWindowHover}
        onShopClick={handleMarkerClick}
        getMarkerForShop={getMarkerForShop}
      />

      <DirectionsRenderer
        map={googleMapRef.current}
        directionsResult={directionsResult}
        tripDirectionsResult={tripDirectionsResult}
        isTripMode={isTripMode}
      />

      <SearchLocationMarker
        map={googleMapRef.current}
        searchLocation={searchLocation}
        radiusMiles={currentRadius}
        showRadius={!!searchLocation}
      />

      <TripMarkersManager
        map={googleMapRef.current}
        tripStops={tripStops}
        isTripMode={isTripMode}
      />
    </div>
  );
};

export default MapComponentRefactored;