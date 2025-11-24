// src/components/Map/DirectionsRenderer.tsx
import { useEffect, useRef } from 'react';

interface DirectionsRendererProps {
  map: google.maps.Map | null;
  directionsResult: google.maps.DirectionsResult | null;
  tripDirectionsResult: google.maps.DirectionsResult | null;
  isTripMode: boolean;
}

/**
 * Manages the rendering of directions on the map.
 * This component is responsible for:
 * - Displaying regular directions from search location to a shop
 * - Displaying trip planner multi-stop directions
 * - Cleaning up old directions when new ones are set
 * - Managing the DirectionsRenderer instance
 */
export const DirectionsRenderer: React.FC<DirectionsRendererProps> = ({
  map,
  directionsResult,
  tripDirectionsResult,
  isTripMode,
}) => {
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Initialize DirectionsRenderer
  useEffect(() => {
    if (!map || !window.google?.maps?.DirectionsRenderer) return;

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true, // We manage our own markers
        preserveViewport: false,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
    } else {
      directionsRendererRef.current.setMap(map);
    }

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [map]);

  // Update directions display based on mode and results
  useEffect(() => {
    if (!directionsRendererRef.current) return;

    // Determine which directions to show
    const activeDirections = isTripMode ? tripDirectionsResult : directionsResult;

    if (activeDirections) {
      directionsRendererRef.current.setDirections(activeDirections);
      directionsRendererRef.current.setOptions({
        preserveViewport: false, // Fit to route bounds
      });
    } else {
      // Clear directions by setting an empty result
      directionsRendererRef.current.setDirections({
        routes: [],
        geocoded_waypoints: [],
        request: {} as google.maps.DirectionsRequest,
      } as google.maps.DirectionsResult);
    }
  }, [directionsResult, tripDirectionsResult, isTripMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
    };
  }, []);

  return null; // This component doesn't render anything directly
};