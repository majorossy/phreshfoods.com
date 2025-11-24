// src/components/Map/SearchLocationMarker.tsx
import { useEffect, useRef } from 'react';
import {
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
  METERS_PER_MILE,
} from '../../config/appConfig';

interface SearchLocationMarkerProps {
  map: google.maps.Map | null;
  searchLocation: google.maps.LatLngLiteral | null;
  radiusMiles: number;
  showRadius: boolean;
}

/**
 * Manages the search location marker and radius circle on the map.
 * This component is responsible for:
 * - Displaying a marker at the user's search location
 * - Drawing a radius circle showing the search area
 * - Updating the radius circle when search radius changes
 * - Cleaning up markers and circles when search is cleared
 */
export const SearchLocationMarker: React.FC<SearchLocationMarkerProps> = ({
  map,
  searchLocation,
  radiusMiles,
  showRadius,
}) => {
  const searchLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchRadiusCircleRef = useRef<google.maps.Circle | null>(null);

  // Create search location marker element
  const createSearchMarkerElement = () => {
    const markerContainer = document.createElement('div');
    markerContainer.style.width = `${SEARCH_MARKER_SIZE_PX}px`;
    markerContainer.style.height = `${SEARCH_MARKER_SIZE_PX}px`;
    markerContainer.style.position = 'relative';
    markerContainer.style.display = 'flex';
    markerContainer.style.alignItems = 'center';
    markerContainer.style.justifyContent = 'center';

    // Outer ring
    const outerRing = document.createElement('div');
    outerRing.style.position = 'absolute';
    outerRing.style.width = `${SEARCH_MARKER_SIZE_PX}px`;
    outerRing.style.height = `${SEARCH_MARKER_SIZE_PX}px`;
    outerRing.style.background = SEARCH_MARKER_COLOR;
    outerRing.style.border = `${SEARCH_MARKER_BORDER_WIDTH_PX}px solid #fff`;
    outerRing.style.borderRadius = '50%';
    outerRing.style.opacity = '0.4';
    outerRing.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';

    // Inner dot
    const innerDot = document.createElement('div');
    innerDot.style.width = `${SEARCH_MARKER_INNER_DOT_SIZE_PX}px`;
    innerDot.style.height = `${SEARCH_MARKER_INNER_DOT_SIZE_PX}px`;
    innerDot.style.background = SEARCH_MARKER_COLOR;
    innerDot.style.border = `2px solid #fff`;
    innerDot.style.borderRadius = '50%';
    innerDot.style.boxShadow = '0 2px 4px rgba(0,0,0,.4)';
    innerDot.style.zIndex = '1';

    markerContainer.appendChild(outerRing);
    markerContainer.appendChild(innerDot);

    return markerContainer;
  };

  // Manage search location marker
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    if (searchLocation) {
      // Create or update search location marker
      if (!searchLocationMarkerRef.current) {
        const markerElement = createSearchMarkerElement();

        searchLocationMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          position: searchLocation,
          map,
          title: 'Search Location',
          content: markerElement,
          zIndex: SEARCH_MARKER_Z_INDEX,
        });
      } else {
        searchLocationMarkerRef.current.position = searchLocation;
        searchLocationMarkerRef.current.map = map;
      }
    } else {
      // Remove search location marker
      if (searchLocationMarkerRef.current) {
        searchLocationMarkerRef.current.map = null;
        searchLocationMarkerRef.current = null;
      }
    }
  }, [map, searchLocation]);

  // Manage radius circle
  useEffect(() => {
    if (!map || !window.google?.maps?.Circle) return;

    if (searchLocation && showRadius) {
      const radiusInMeters = radiusMiles * METERS_PER_MILE;

      if (!searchRadiusCircleRef.current) {
        // Create radius circle
        searchRadiusCircleRef.current = new google.maps.Circle({
          map,
          center: searchLocation,
          radius: radiusInMeters,
          fillColor: RADIUS_CIRCLE_COLOR,
          fillOpacity: RADIUS_CIRCLE_FILL_OPACITY,
          strokeColor: RADIUS_CIRCLE_COLOR,
          strokeOpacity: RADIUS_CIRCLE_STROKE_OPACITY,
          strokeWeight: RADIUS_CIRCLE_STROKE_WIDTH,
          clickable: false,
          zIndex: RADIUS_CIRCLE_Z_INDEX,
        });
      } else {
        // Update existing circle
        searchRadiusCircleRef.current.setCenter(searchLocation);
        searchRadiusCircleRef.current.setRadius(radiusInMeters);
        searchRadiusCircleRef.current.setMap(map);
      }
    } else {
      // Remove radius circle
      if (searchRadiusCircleRef.current) {
        searchRadiusCircleRef.current.setMap(null);
        searchRadiusCircleRef.current = null;
      }
    }
  }, [map, searchLocation, radiusMiles, showRadius]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchLocationMarkerRef.current) {
        searchLocationMarkerRef.current.map = null;
        searchLocationMarkerRef.current = null;
      }
      if (searchRadiusCircleRef.current) {
        searchRadiusCircleRef.current.setMap(null);
        searchRadiusCircleRef.current = null;
      }
    };
  }, []);

  return null; // This component doesn't render anything directly
};