// src/components/Map/TripMarkersManager.tsx
import { useEffect, useRef } from 'react';
import { Shop } from '../../types';

interface TripMarkersManagerProps {
  map: google.maps.Map | null;
  tripStops: Shop[];
  isTripMode: boolean;
}

/**
 * Manages markers for trip planner stops.
 * This component is responsible for:
 * - Creating numbered markers for each stop in the trip
 * - Showing stop order visually with numbers
 * - Cleaning up trip markers when trip mode is disabled
 */
export const TripMarkersManager: React.FC<TripMarkersManagerProps> = ({
  map,
  tripStops,
  isTripMode,
}) => {
  const tripStopMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  // Create trip stop marker element with number
  const createTripStopMarkerElement = (stopNumber: number) => {
    const markerContainer = document.createElement('div');
    markerContainer.style.width = '32px';
    markerContainer.style.height = '42px';
    markerContainer.style.position = 'relative';

    // Pin shape
    const pin = document.createElement('div');
    pin.style.width = '32px';
    pin.style.height = '32px';
    pin.style.background = '#4285F4';
    pin.style.borderRadius = '50% 50% 50% 0';
    pin.style.transform = 'rotate(-45deg)';
    pin.style.border = '2px solid #fff';
    pin.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    pin.style.position = 'absolute';
    pin.style.top = '0';
    pin.style.left = '0';

    // Number label
    const numberLabel = document.createElement('div');
    numberLabel.textContent = String(stopNumber);
    numberLabel.style.position = 'absolute';
    numberLabel.style.top = '8px';
    numberLabel.style.left = '50%';
    numberLabel.style.transform = 'translateX(-50%)';
    numberLabel.style.color = '#fff';
    numberLabel.style.fontSize = '14px';
    numberLabel.style.fontWeight = 'bold';
    numberLabel.style.fontFamily = 'Arial, sans-serif';
    numberLabel.style.zIndex = '1';
    numberLabel.style.textShadow = '0 1px 2px rgba(0,0,0,.3)';

    markerContainer.appendChild(pin);
    markerContainer.appendChild(numberLabel);

    return markerContainer;
  };

  // Manage trip stop markers
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    if (isTripMode && tripStops.length > 0) {
      // Create or update trip stop markers
      tripStops.forEach((shop, index) => {
        const markerId = `trip-${shop.slug}`;
        const stopNumber = index + 1;

        if (!tripStopMarkersRef.current.has(markerId)) {
          // Create new trip marker
          const markerElement = createTripStopMarkerElement(stopNumber);

          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: { lat: shop.lat, lng: shop.lng },
            map,
            title: `Stop ${stopNumber}: ${shop.Name}`,
            content: markerElement,
            zIndex: 1000 + index, // Higher than regular markers
          });

          tripStopMarkersRef.current.set(markerId, marker);
        } else {
          // Update existing marker number if order changed
          const existingMarker = tripStopMarkersRef.current.get(markerId);
          if (existingMarker) {
            const numberLabel = (existingMarker.content as HTMLElement).querySelector('div:last-child');
            if (numberLabel) {
              numberLabel.textContent = String(stopNumber);
            }
          }
        }
      });

      // Remove markers for stops that are no longer in the trip
      const currentTripIds = new Set(tripStops.map(shop => `trip-${shop.slug}`));
      tripStopMarkersRef.current.forEach((marker, markerId) => {
        if (!currentTripIds.has(markerId)) {
          marker.map = null;
          tripStopMarkersRef.current.delete(markerId);
        }
      });
    } else {
      // Clear all trip markers when not in trip mode
      tripStopMarkersRef.current.forEach(marker => {
        marker.map = null;
      });
      tripStopMarkersRef.current.clear();
    }
  }, [map, tripStops, isTripMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tripStopMarkersRef.current.forEach(marker => {
        marker.map = null;
      });
      tripStopMarkersRef.current.clear();
    };
  }, []);

  return null; // This component doesn't render anything directly
};