// src/components/Map/MarkerManager.tsx
import { useEffect, useRef, useCallback } from 'react';
import { Shop } from '../../types';
import {
  markerColor,
  MARKER_COLORS,
  MARKER_SIZE_PX,
  MARKER_BORDER_WIDTH_PX,
  MARKER_TRANSITION_DURATION_S,
  MARKER_DEFAULT_SCALE,
  MARKER_HOVER_SCALE,
  MARKER_SELECTED_SCALE,
  MARKER_DEFAULT_Z_INDEX_OFFSET,
  MARKER_SELECTED_Z_INDEX,
  MARKER_HOVER_Z_INDEX,
  MARKER_HOVER_COLOR,
  MARKER_HOVER_DEBOUNCE_MS,
} from '../../config/appConfig';

interface MarkerManagerProps {
  map: google.maps.Map | null;
  shops: Shop[];
  selectedShop: Shop | null;
  hoveredShop: Shop | null;
  onMarkerClick: (shop: Shop) => void;
  onMarkerHover: (shop: Shop | null) => void;
}

/**
 * Manages map markers for shops, including creation, updates, and interactions.
 * This component is responsible for:
 * - Creating and managing shop markers on the map
 * - Handling marker hover and click events
 * - Updating marker appearance based on selection/hover state
 * - Cleaning up markers when shops are removed
 */
export const MarkerManager: React.FC<MarkerManagerProps> = ({
  map,
  shops,
  selectedShop,
  hoveredShop,
  onMarkerClick,
  onMarkerHover,
}) => {
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMarkerHovered = useRef<boolean>(false);

  // Create marker element with specified color
  const createMarkerElement = useCallback((color: string = markerColor) => {
    const markerElement = document.createElement('div');
    markerElement.style.width = `${MARKER_SIZE_PX}px`;
    markerElement.style.height = `${MARKER_SIZE_PX}px`;
    markerElement.style.background = color;
    markerElement.style.border = `${MARKER_BORDER_WIDTH_PX}px solid #fff`;
    markerElement.style.borderRadius = '50%';
    markerElement.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    markerElement.style.cursor = 'pointer';
    markerElement.style.transition = `transform ${MARKER_TRANSITION_DURATION_S}s ease, background ${MARKER_TRANSITION_DURATION_S}s ease`;
    markerElement.style.transformOrigin = 'center bottom';
    markerElement.style.transform = `scale(${MARKER_DEFAULT_SCALE})`;
    return markerElement;
  }, []);

  // Handle hover with debounce
  const handleMarkerHover = useCallback((shop: Shop | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (shop) {
      isMarkerHovered.current = true;
      onMarkerHover(shop);
    } else {
      isMarkerHovered.current = false;
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isMarkerHovered.current) {
          onMarkerHover(null);
        }
      }, MARKER_HOVER_DEBOUNCE_MS);
    }
  }, [onMarkerHover]);

  // Update marker appearance based on state
  const updateMarkerAppearance = useCallback((
    marker: google.maps.marker.AdvancedMarkerElement,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    const element = marker.content as HTMLElement;
    if (element) {
      if (isSelected) {
        element.style.background = MARKER_COLORS.selected;
        element.style.transform = `scale(${MARKER_SELECTED_SCALE})`;
        marker.zIndex = MARKER_SELECTED_Z_INDEX;
      } else if (isHovered) {
        element.style.background = MARKER_HOVER_COLOR;
        element.style.transform = `scale(${MARKER_HOVER_SCALE})`;
        marker.zIndex = MARKER_HOVER_Z_INDEX;
      } else {
        element.style.background = markerColor;
        element.style.transform = `scale(${MARKER_DEFAULT_SCALE})`;
        marker.zIndex = MARKER_DEFAULT_Z_INDEX_OFFSET;
      }
    }
  }, []);

  // Create or update markers for shops
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Create new markers for shops that don't have one
    shops.forEach(shop => {
      if (!markersRef.current.has(shop.slug)) {
        const markerElement = createMarkerElement();

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: shop.lat, lng: shop.lng },
          map,
          title: shop.Name,
          content: markerElement,
          zIndex: MARKER_DEFAULT_Z_INDEX_OFFSET,
        });

        // Add event listeners
        markerElement.addEventListener('click', () => onMarkerClick(shop));
        markerElement.addEventListener('mouseenter', () => handleMarkerHover(shop));
        markerElement.addEventListener('mouseleave', () => handleMarkerHover(null));

        markersRef.current.set(shop.slug, marker);
      }
    });

    // Remove markers for shops that no longer exist
    const currentShopSlugs = new Set(shops.map(shop => shop.slug));
    markersRef.current.forEach((marker, slug) => {
      if (!currentShopSlugs.has(slug)) {
        marker.map = null;
        markersRef.current.delete(slug);
      }
    });

    // Update marker appearances
    markersRef.current.forEach((marker, slug) => {
      const isSelected = selectedShop?.slug === slug;
      const isHovered = hoveredShop?.slug === slug;
      updateMarkerAppearance(marker, isSelected, isHovered);
    });

  }, [map, shops, selectedShop, hoveredShop, createMarkerElement, onMarkerClick, handleMarkerHover, updateMarkerAppearance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current.clear();
    };
  }, []);

  return null; // This component doesn't render anything directly
};