// src/components/Map/InfoWindowManager.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { Shop } from '../../types';
import InfoWindowContent from './InfoWindowContent';
import {
  INFO_WINDOW_PIXEL_OFFSET_X,
  INFO_WINDOW_PIXEL_OFFSET_Y,
  OVERLAY_RENDER_WAIT_MS,
} from '../../config/appConfig';

interface InfoWindowManagerProps {
  map: google.maps.Map | null;
  hoveredShop: Shop | null;
  onInfoWindowHover: (isHovered: boolean) => void;
  onShopClick: (shop: Shop) => void;
  getMarkerForShop: (slug: string) => google.maps.marker.AdvancedMarkerElement | undefined;
}

/**
 * Manages the Google Maps InfoWindow for shop previews.
 * This component is responsible for:
 * - Creating and positioning the InfoWindow when a shop is hovered
 * - Rendering React content inside the InfoWindow
 * - Handling InfoWindow hover state for maintaining visibility
 * - Cleaning up React roots and InfoWindow on unmount
 */
export const InfoWindowManager: React.FC<InfoWindowManagerProps> = ({
  map,
  hoveredShop,
  onInfoWindowHover,
  onShopClick,
  getMarkerForShop,
}) => {
  const googleInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const infoWindowReactRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(null);
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInfoWindowHovered = useRef<boolean>(false);

  // Unmount React root for InfoWindow content
  const unmountInfoWindowReactRoot = useCallback(() => {
    if (unmountTimeoutRef.current) {
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = null;
    }

    unmountTimeoutRef.current = setTimeout(() => {
      if (infoWindowReactRootRef.current) {
        try {
          infoWindowReactRootRef.current.unmount();
          infoWindowReactRootRef.current = null;
        } catch (error) {
          console.error('Error unmounting InfoWindow React root:', error);
        }
      }
    }, OVERLAY_RENDER_WAIT_MS);
  }, []);

  // Close native InfoWindow
  const closeNativeInfoWindow = useCallback(() => {
    if (googleInfoWindowRef.current?.getMap()) {
      googleInfoWindowRef.current.close();
    }
  }, []);

  // Initialize InfoWindow
  useEffect(() => {
    if (!map || !window.google?.maps?.InfoWindow) return;

    if (!googleInfoWindowRef.current) {
      googleInfoWindowRef.current = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(INFO_WINDOW_PIXEL_OFFSET_X, INFO_WINDOW_PIXEL_OFFSET_Y),
        disableAutoPan: false,
      });

      // Track hover state on InfoWindow
      google.maps.event.addListener(googleInfoWindowRef.current, 'domready', () => {
        const infoWindowElement = document.querySelector('.gm-style-iw-c');
        if (infoWindowElement) {
          infoWindowElement.addEventListener('mouseenter', () => {
            isInfoWindowHovered.current = true;
            onInfoWindowHover(true);
          });
          infoWindowElement.addEventListener('mouseleave', () => {
            isInfoWindowHovered.current = false;
            onInfoWindowHover(false);
          });
        }
      });
    }

    return () => {
      if (googleInfoWindowRef.current) {
        googleInfoWindowRef.current.close();
        google.maps.event.clearInstanceListeners(googleInfoWindowRef.current);
        googleInfoWindowRef.current = null;
      }
      unmountInfoWindowReactRoot();
    };
  }, [map, onInfoWindowHover, unmountInfoWindowReactRoot]);

  // Handle hovered shop changes
  useEffect(() => {
    if (!map || !googleInfoWindowRef.current) return;

    if (hoveredShop) {
      const marker = getMarkerForShop(hoveredShop.slug);
      if (!marker) return;

      // Create container for React content
      const contentContainer = document.createElement('div');

      // Close any existing InfoWindow and unmount previous React root
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();

      // Create new React root and render content
      infoWindowReactRootRef.current = ReactDOM.createRoot(contentContainer);
      infoWindowReactRootRef.current.render(
        <InfoWindowContent
          shop={hoveredShop}
          onShopClick={onShopClick}
        />
      );

      // Set content and open InfoWindow
      googleInfoWindowRef.current.setContent(contentContainer);
      googleInfoWindowRef.current.open({
        map,
        anchor: marker,
      });
    } else {
      // Close InfoWindow when no shop is hovered
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();
    }
  }, [map, hoveredShop, onShopClick, getMarkerForShop, closeNativeInfoWindow, unmountInfoWindowReactRoot]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
      closeNativeInfoWindow();
      unmountInfoWindowReactRoot();
    };
  }, [closeNativeInfoWindow, unmountInfoWindowReactRoot]);

  return null; // This component doesn't render anything directly
};